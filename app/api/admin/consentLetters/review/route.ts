import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Admin review for consent letters (DocumentType.CONSENT_LETTER)
 * POST /api/admin/consentLetters/review
 * Body: { applicationId: string, decision: "ACCEPT" | "REJECT", adminRemarks?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin user
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { applicationId, decision, adminRemarks } = body as {
      applicationId?: string
      decision?: "ACCEPT" | "REJECT"
      adminRemarks?: string
    }

    if (!applicationId || !decision) {
      return NextResponse.json(
        { error: "applicationId and decision are required" },
        { status: 400 }
      )
    }

    if (!["ACCEPT", "REJECT"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be ACCEPT or REJECT" },
        { status: 400 }
      )
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Only allow review while in overlap-consent stage
    if (application.status !== "OVERLAP_DETECTED_PENDING_CONSENT") {
      return NextResponse.json(
        { error: "Consent letter can only be reviewed while application is in OVERLAP_DETECTED_PENDING_CONSENT status" },
        { status: 400 }
      )
    }

    // Find latest CONSENT_LETTER document for this application
    const consentDocument = await prisma.document.findFirst({
      where: {
        applicationId,
        documentType: "CONSENT_LETTER",
        isComplete: true,
      },
      orderBy: { uploadedAt: "desc" },
    })

    if (!consentDocument) {
      return NextResponse.json(
        { error: "No consent letter document found for this application" },
        { status: 404 }
      )
    }

    // Update document remarks for traceability
    await prisma.document.update({
      where: { id: consentDocument.id },
      data: {
        remarks: adminRemarks || null,
      },
    })

    const previousStatus = application.status

    if (decision === "ACCEPT") {
      // Mark coordinates as approved and move application back to editable draft phase
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: "DRAFT",
          coordinateApprovedAt: new Date(),
        },
      })

      // Status history entry
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: previousStatus,
          toStatus: "DRAFT",
          changedBy: adminUser.id,
          changedByRole: adminUser.role,
          remarks: adminRemarks || "Consent letter verified by admin",
        },
      })

      // Notify applicant
      await prisma.notification.create({
        data: {
          userId: application.userId,
          applicationId,
          type: "CONSENT_VERIFIED",
          title: "Consent Document Verified",
          message:
            adminRemarks && adminRemarks.length > 0
              ? `Your consent letter has been verified. Remarks: ${adminRemarks}`
              : "Your consent letter has been verified by the admin.",
          link: `/applications/${applicationId}`,
        },
      })

      return NextResponse.json({
        message: "Consent letter approved",
        application: updatedApplication,
      })
    }

    // REJECT path
    if (!adminRemarks || adminRemarks.trim().length === 0) {
      return NextResponse.json(
        { error: "adminRemarks are required when rejecting a consent letter" },
        { status: 400 }
      )
    }

    // Keep status as OVERLAP_DETECTED_PENDING_CONSENT; applicant must upload a new letter
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: previousStatus,
        toStatus: previousStatus,
        changedBy: adminUser.id,
        changedByRole: adminUser.role,
        remarks: `Consent letter rejected: ${adminRemarks}`,
      },
    })

    await prisma.notification.create({
      data: {
        userId: application.userId,
        applicationId,
        type: "CONSENT_REJECTED",
        title: "Consent Document Rejected",
        message: `Your consent letter has been rejected. Reason: ${adminRemarks}`,
        link: `/applications/${applicationId}`,
      },
    })

    return NextResponse.json({
      message: "Consent letter rejected",
    })
  } catch (error) {
    console.error("Consent letter review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
