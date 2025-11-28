import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Cron job to check for expired admin evaluation deadlines
 * If admin doesn't review within deadline, auto-accept the requirement
 * This should be called daily
 * GET /api/cron/checkAutoAcceptDeadlines?key=cron_secret
 */

export async function GET(request: NextRequest) {
  // Simple auth check for cron job
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const now = new Date()

    const results = {
      coordinatesChecked: 0,
      coordinatesAutoApproved: 0,
      requirementsChecked: 0,
      requirementsAutoAccepted: 0,
      errors: [] as string[],
    }

    // === PART 1: Check for expired coordinate review deadlines ===
    const expiredCoordinates = await prisma.application.findMany({
      where: {
        status: "PENDING_COORDINATE_APPROVAL",
        coordinateReviewDeadline: {
          lt: now,
        },
      },
      include: { user: true },
    })

    results.coordinatesChecked = expiredCoordinates.length

    for (const application of expiredCoordinates) {
      try {
        // Auto-approve coordinates
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "DRAFT",
            coordinateApprovedAt: now,
            coordinateReviewDeadline: null,
            coordinateReviewRemarks: "Auto-approved due to admin review deadline expiration",
          },
        })

        // Create status history
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: "PENDING_COORDINATE_APPROVAL",
            toStatus: "DRAFT",
            changedBy: "SYSTEM",
            changedByRole: "SYSTEM",
            remarks: "Coordinates auto-approved due to admin review deadline expiration",
          },
        })

        // Notify applicant
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "COORDINATES_AUTO_APPROVED",
            title: "Coordinates Auto-Approved",
            message: `Your project coordinates for application ${application.applicationNo} have been auto-approved due to admin review deadline expiration. You can now continue with your application.`,
            link: `/applications/${application.id}`,
          },
        })

        results.coordinatesAutoApproved++
      } catch (error) {
        results.errors.push(`Failed to auto-approve coordinates for ${application.id}: ${error}`)
      }
    }

    // === PART 2: Check for expired acceptance requirement deadlines ===
    // Find all requirements with expired auto-accept deadlines that are still PENDING_REVIEW
    const expiredRequirements = await prisma.acceptanceRequirement.findMany({
      where: {
        status: "PENDING_REVIEW",
        autoAcceptDeadline: {
          lt: now,
        },
        isAutoAccepted: false,
      },
      include: {
        application: {
          include: { user: true },
        },
      },
    })

    results.requirementsChecked = expiredRequirements.length

    // Auto-accept requirements with expired admin deadline
    for (const requirement of expiredRequirements) {
      try {
        const application = requirement.application

        // Mark requirement as accepted
        await prisma.acceptanceRequirement.update({
          where: { id: requirement.id },
          data: {
            status: "ACCEPTED",
            isAutoAccepted: true,
            reviewedAt: now,
            adminRemarks: "Auto-accepted due to admin evaluation deadline expiration",
          },
        })

        // Check if ALL acceptance requirements are now ACCEPTED
        const allRequirements = await prisma.acceptanceRequirement.findMany({
          where: { applicationId: application.id },
        })

        const allAccepted = allRequirements.every(req => req.status === "ACCEPTED")

        if (allAccepted) {
          // All requirements completed - unlock Other Documents phase
          await prisma.application.update({
            where: { id: application.id },
            data: {
              status: "PENDING_OTHER_DOCUMENTS", // Move to Other Documents phase
            },
          })
        }

        // Create notification for applicant
        const message = allAccepted
          ? `Your "${requirement.requirementName}" has been auto-accepted. All acceptance requirements have been completed. You can now proceed to Other Documents.`
          : `Your "${requirement.requirementName}" has been auto-accepted due to admin evaluation timeout.`

        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "REQUIREMENT_AUTO_ACCEPTED",
            title: "Requirement Auto-Accepted",
            message,
            link: `/applications/${application.id}`,
          },
        })

        results.requirementsAutoAccepted++
      } catch (error) {
        results.errors.push(`Failed to auto-accept requirement ${requirement.id}: ${error}`)
      }
    }

    return NextResponse.json(
      {
        message: "Auto-accept deadline check completed",
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
