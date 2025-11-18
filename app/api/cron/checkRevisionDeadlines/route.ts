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

    const results = {
      checked: expiredRequirements.length,
      voided: 0,
      errors: [] as string[],
    }

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

        results.voided++
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
