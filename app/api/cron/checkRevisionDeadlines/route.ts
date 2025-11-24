import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Cron job to check for expired revision deadlines
 * If applicant doesn't resubmit within 14 days of rejection, void the application
 * This should be called daily
 * GET /api/cron/checkRevisionDeadlines?key=cron_secret
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
      coordinatesVoided: 0,
      requirementsChecked: 0,
      requirementsVoided: 0,
      errors: [] as string[],
    }

    // === PART 1: Check for expired coordinate revision deadlines ===
    const expiredCoordinates = await prisma.application.findMany({
      where: {
        status: "COORDINATE_REVISION_REQUIRED",
        coordinateRevisionDeadline: {
          lt: now,
        },
      },
      include: { user: true },
    })

    results.coordinatesChecked = expiredCoordinates.length

    for (const application of expiredCoordinates) {
      try {
        // Void the application
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "VOIDED",
            coordinateRevisionDeadline: null,
          },
        })

        // Create status history
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: "COORDINATE_REVISION_REQUIRED",
            toStatus: "VOIDED",
            changedBy: "SYSTEM",
            changedByRole: "SYSTEM",
            remarks: "Application voided due to coordinate revision deadline expiration",
          },
        })

        // Notify applicant
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "COORDINATES_REVISION_EXPIRED",
            title: "Application Voided",
            message: `Your application ${application.applicationNo} has been voided due to expiration of the coordinate revision deadline. Please start a new application.`,
            link: `/applications`,
          },
        })

        results.coordinatesVoided++
      } catch (error) {
        results.errors.push(`Failed to void application ${application.id}: ${error}`)
      }
    }

    // === PART 2: Check for expired requirement revision deadlines ===
    // Find all requirements with expired revision deadlines that are in REVISION_REQUIRED status
    const expiredRequirements = await prisma.acceptanceRequirement.findMany({
      where: {
        status: "REVISION_REQUIRED",
        revisionDeadline: {
          lt: now,
        },
        isVoided: false,
      },
      include: {
        application: {
          include: { user: true },
        },
      },
    })

    results.requirementsChecked = expiredRequirements.length

    // Void applications with expired revisions
    for (const requirement of expiredRequirements) {
      try {
        // Mark requirement as voided
        await prisma.acceptanceRequirement.update({
          where: { id: requirement.id },
          data: {
            isVoided: true,
            voidedAt: now,
            voidReason: "Revision deadline expired",
          },
        })

        // Mark application as voided
        const application = requirement.application
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "VOIDED",
          },
        })

        // Create notification for applicant
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "APPLICATION_VOIDED",
            title: "Application Voided",
            message: `Your application has been voided due to expiration of the revision deadline for "${requirement.requirementName}". Please start a new application.`,
            link: `/applications`,
          },
        })

        results.requirementsVoided++
      } catch (error) {
        results.errors.push(`Failed to void requirement ${requirement.id}: ${error}`)
      }
    }

    return NextResponse.json(
      {
        message: "Revision deadline check completed",
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
