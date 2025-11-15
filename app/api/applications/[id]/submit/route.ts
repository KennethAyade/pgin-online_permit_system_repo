import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { submitApplicationSchema } from "@/lib/validations/application"
import { sendEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if application exists and belongs to user
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        documents: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Allow submission of new or revised applications
    const allowedStatuses = ["DRAFT", "RETURNED", "FOR_ACTION"] as const
    if (!allowedStatuses.includes(application.status as any)) {
      return NextResponse.json(
        { error: "Application cannot be submitted in its current status" },
        { status: 400 }
      )
    }

    // Check if all required documents are uploaded
    const requiredDocs = application.permitType === "ISAG"
      ? [
          "APPLICATION_FORM",
          "SURVEY_PLAN",
          "LOCATION_MAP",
          "WORK_PROGRAM",
          "IEE_REPORT",
          "EPEP",
          "PROOF_TECHNICAL_COMPETENCE",
          "PROOF_FINANCIAL_CAPABILITY",
          "ARTICLES_INCORPORATION",
        ]
      : [
          "APPLICATION_FORM",
          "SURVEY_PLAN",
          "LOCATION_MAP",
          "WORK_PROGRAM",
          "IEE_REPORT",
          "PROOF_TECHNICAL_COMPETENCE",
          "PROOF_FINANCIAL_CAPABILITY",
          "ARTICLES_INCORPORATION",
        ]

    const uploadedDocTypes = application.documents.map((doc) => doc.documentType)
    const missingDocs = requiredDocs.filter(
      (docType) => !uploadedDocTypes.includes(docType as any)
    )

    if (missingDocs.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required documents",
          missingDocuments: missingDocs,
        },
        { status: 400 }
      )
    }

    const previousStatus = application.status
    const isResubmission = previousStatus === "RETURNED" || previousStatus === "FOR_ACTION"

    // Update application status to SUBMITTED
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedTo: process.env.DEFAULT_RECIPIENT || "PGIN Regional Office",
      },
    })

    // Create status history entry
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: previousStatus,
        toStatus: "SUBMITTED",
        changedBy: session.user.id,
        changedByRole: "applicant",
        remarks: isResubmission
          ? "Application resubmitted by applicant"
          : "Application submitted by applicant",
      },
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        applicationId: application.id,
        type: "APPLICATION_SUBMITTED",
        title: isResubmission ? "Application Resubmitted" : "New Application Submitted",
        message: isResubmission
          ? `Application ${application.applicationNo} has been resubmitted by ${application.user.fullName}`
          : `Application ${application.applicationNo} has been submitted by ${application.user.fullName}`,
        link: `/admin/applications/${application.id}`,
      },
    })

    // Send email notification to user
    await sendEmail({
      to: application.user.email,
      subject: isResubmission
        ? "Application Resubmitted - SAG Permit System"
        : "Application Submitted - SAG Permit System",
      html: `
        <h2>Application ${isResubmission ? "Resubmitted" : "Submitted"} Successfully</h2>
        <p>Hello ${application.user.fullName},</p>
        <p>Your application (${application.applicationNo}) has been ${
          isResubmission ? "resubmitted" : "submitted"
        } successfully.</p>
        <p>You can track its status in your dashboard.</p>
      `,
    })

    return NextResponse.json({
      application: updatedApplication,
      message: "Application submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

