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

    const results = {
      checked: expiredRequirements.length,
      autoAccepted: 0,
      errors: [] as string[],
    }

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

        // Get next requirement
        const nextRequirement = await prisma.acceptanceRequirement.findFirst({
          where: {
            applicationId: application.id,
            order: { gt: requirement.order },
          },
          orderBy: { order: "asc" },
        })

        if (nextRequirement) {
          // Update application to point to next requirement
          await prisma.application.update({
            where: { id: application.id },
            data: { currentAcceptanceRequirementId: nextRequirement.id },
          })
        } else {
          // All requirements completed
          await prisma.application.update({
            where: { id: application.id },
            data: {
              currentAcceptanceRequirementId: null,
              status: "UNDER_REVIEW", // Move to next stage
            },
          })
        }

        // Create notification for applicant
        const message = nextRequirement
          ? `Your "${requirement.requirementName}" has been auto-accepted due to admin evaluation timeout. Please proceed to submit "${nextRequirement.requirementName}".`
          : `Your "${requirement.requirementName}" has been auto-accepted. All requirements have been completed.`

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

        results.autoAccepted++
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
