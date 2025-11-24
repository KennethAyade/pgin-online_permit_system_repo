import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Submit an acceptance requirement
 * POST /api/acceptanceRequirements/submit
 * Body: { requirementId: string, submittedData?: string, submittedFileUrl?: string }
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

    const body = await request.json()
    const { requirementId, submittedData, submittedFileUrl, submittedFileName } = body

    if (!requirementId) {
      return NextResponse.json(
        { error: "Requirement ID is required" },
        { status: 400 }
      )
    }

    // If submitting data, at least one must be provided
    if (!submittedData && !submittedFileUrl) {
      return NextResponse.json(
        { error: "Either submittedData or submittedFileUrl must be provided" },
        { status: 400 }
      )
    }

    // Get requirement
    const requirement = await prisma.acceptanceRequirement.findUnique({
      where: { id: requirementId },
      include: { application: { include: { user: true } } },
    })

    if (!requirement) {
      return NextResponse.json(
        { error: "Requirement not found" },
        { status: 404 }
      )
    }

    // Verify ownership
    if (requirement.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Check if requirement is in correct state for submission
    if (requirement.status !== "PENDING_SUBMISSION" && requirement.status !== "REVISION_REQUIRED") {
      return NextResponse.json(
        { error: `Cannot submit requirement in ${requirement.status} status` },
        { status: 409 }
      )
    }

    // Check if application is in valid state
    const application = requirement.application
    if (application.status === "VOIDED") {
      return NextResponse.json(
        { error: "Application has been voided" },
        { status: 409 }
      )
    }

    // Update requirement status to PENDING_REVIEW
    const updatedRequirement = await prisma.acceptanceRequirement.update({
      where: { id: requirementId },
      data: {
        status: "PENDING_REVIEW",
        submittedData,
        submittedFileUrl,
        submittedFileName,
        submittedAt: new Date(),
        submittedBy: session.user.id,
        // Set auto-accept deadline (14 working days from now)
        autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
      },
    })

    // Create notification for applicant
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        applicationId: application.id,
        type: "REQUIREMENT_PENDING_REVIEW",
        title: "Requirement Submitted",
        message: `Your "${requirement.requirementName}" has been submitted for review.`,
        link: `/applications/${application.id}`,
      },
    })

    return NextResponse.json(
      {
        message: "Requirement submitted successfully",
        requirement: updatedRequirement,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
