import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { addWorkingDays } from "@/lib/utils"
import { REVISION_DEADLINE_DAYS } from "@/lib/constants"
import { normalizeCoordinates } from "@/lib/geo/coordinate-validation"
import { createCoordinateHistory } from "@/lib/services/coordinate-history"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin access
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { applicationId, decision, remarks } = body

    if (!applicationId || !decision) {
      return NextResponse.json(
        { error: "Application ID and decision are required" },
        { status: 400 }
      )
    }

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    // Get the application
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

    // Verify application is pending coordinate approval
    if (application.status !== "PENDING_COORDINATE_APPROVAL") {
      return NextResponse.json(
        { error: "Application is not pending coordinate approval" },
        { status: 400 }
      )
    }

    let updateData: any = {
      coordinateReviewRemarks: remarks || null,
      coordinateReviewDeadline: null, // Clear the review deadline
    }

    let newStatus: string
    let notificationType: string
    let notificationTitle: string
    let notificationMessage: string

    if (decision === "APPROVED") {
      // Phase 2.4: Check consent requirements before approval
      const overlapConsents = await prisma.overlapConsent.findMany({
        where: {
          newApplicationId: applicationId,
        },
      })

      // If there are overlaps, verify all consents are verified
      if (overlapConsents.length > 0) {
        const allVerified = overlapConsents.every(
          (consent) => consent.consentStatus === "VERIFIED"
        )

        if (!allVerified) {
          const pendingCount = overlapConsents.filter(
            (c) => c.consentStatus === "UPLOADED" || c.consentStatus === "REQUIRED"
          ).length
          const rejectedCount = overlapConsents.filter(
            (c) => c.consentStatus === "REJECTED"
          ).length

          return NextResponse.json(
            {
              error: "Cannot approve coordinates - consent requirements not met",
              details: {
                totalOverlaps: overlapConsents.length,
                verifiedConsents: overlapConsents.filter(
                  (c) => c.consentStatus === "VERIFIED"
                ).length,
                pendingConsents: pendingCount,
                rejectedConsents: rejectedCount,
              },
              message:
                pendingCount > 0
                  ? `There are ${pendingCount} consent document(s) pending verification.`
                  : `There are ${rejectedCount} rejected consent document(s) that need to be re-uploaded.`,
            },
            { status: 400 }
          )
        }
      }

      newStatus = "DRAFT"
      updateData.coordinateApprovedAt = new Date()
      updateData.coordinateRevisionDeadline = null
      notificationType = "COORDINATES_APPROVED"
      notificationTitle = "Coordinates Approved"
      notificationMessage = `Your project coordinates for application ${application.applicationNo} have been approved. You can now continue with your application.`
    } else {
      // REJECTED
      newStatus = "COORDINATE_REVISION_REQUIRED"
      const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS)
      updateData.coordinateRevisionDeadline = revisionDeadline
      updateData.coordinateApprovedAt = null
      notificationType = "COORDINATES_REJECTED"
      notificationTitle = "Coordinates Rejected - Revision Required"
      notificationMessage = `Your project coordinates for application ${application.applicationNo} have been rejected. Reason: ${remarks || "No remarks provided"}. Please revise and resubmit within 14 working days.`
    }

    updateData.status = newStatus

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
    })

    // Phase 2.3: Create CoordinateHistory record when coordinates are approved
    if (decision === "APPROVED") {
      // Get normalized coordinates from application
      const coordinates = normalizeCoordinates(application.projectCoordinates)

      if (coordinates && coordinates.length >= 3) {
        await createCoordinateHistory(
          applicationId,
          coordinates,
          adminUser.id
        )
      } else {
        console.error("Failed to create coordinate history: Invalid coordinates format")
      }
    }

    // Create status history entry
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: "PENDING_COORDINATE_APPROVAL",
        toStatus: newStatus as any,
        changedBy: adminUser.id,
        changedByRole: adminUser.role,
        remarks: remarks || (decision === "APPROVED" ? "Coordinates approved" : "Coordinates rejected"),
      },
    })

    // Create notification for applicant
    await prisma.notification.create({
      data: {
        userId: application.userId,
        applicationId,
        type: notificationType as any,
        title: notificationTitle,
        message: notificationMessage,
        link: `/applications/${applicationId}`,
      },
    })

    return NextResponse.json({
      application: updatedApplication,
      message: decision === "APPROVED"
        ? "Coordinates approved successfully"
        : "Coordinates rejected, applicant notified",
    })
  } catch (error) {
    console.error("Error reviewing coordinates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
