import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { REVISION_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Admin review of acceptance requirement - Accept or Reject
 * POST /api/admin/acceptanceRequirements/review
 * Body: {
 *   requirementId: string,
 *   decision: "ACCEPT" | "REJECT",
 *   adminRemarks?: string,
 *   adminRemarkFileUrl?: string,
 *   adminRemarkFileName?: string
 * }
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

    // Verify admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requirementId, decision, adminRemarks, adminRemarkFileUrl, adminRemarkFileName, isCompliant } = body

    if (!requirementId || !decision) {
      return NextResponse.json(
        { error: "Requirement ID and decision are required" },
        { status: 400 }
      )
    }

    if (!["ACCEPT", "REJECT"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be either ACCEPT or REJECT" },
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

    // Check if in correct state for review
    if (requirement.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: `Cannot review requirement in ${requirement.status} status` },
        { status: 409 }
      )
    }

    const application = requirement.application

    if (decision === "ACCEPT") {
      // ACCEPT the requirement
      const updatedRequirement = await prisma.acceptanceRequirement.update({
        where: { id: requirementId },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: adminUser.id,
          adminRemarks,
          adminRemarkFileUrl,
          adminRemarkFileName,
          // Compliance will be set during evaluation step (EvaluationChecklist)
        },
      })

      // Check if ALL acceptance requirements are now ACCEPTED
      const allRequirements = await prisma.acceptanceRequirement.findMany({
        where: { applicationId: application.id },
      })

      const allAccepted = allRequirements.every(req => req.status === "ACCEPTED")

      if (allAccepted) {
        // All requirements are accepted - unlock Other Documents section
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "PENDING_OTHER_DOCUMENTS",
          },
        })

        // Initialize Other Documents (Phase 2) - only if not already initialized
        const existingOtherDocs = await prisma.otherDocument.findMany({
          where: { applicationId: application.id },
        })

        if (existingOtherDocs.length === 0) {
          const otherDocTypes = [
            { type: "ECC", name: "Environmental Compliance Certificate" },
            { type: "LGU_ENDORSEMENT", name: "LGU Endorsement" },
            { type: "COMMUNITY_CONSENT", name: "Community Consent" },
            { type: "ANCESTRAL_DOMAIN_CLEARANCE", name: "Ancestral Domain Clearance" },
            { type: "BUSINESS_PERMIT", name: "Business Permit" },
          ]

          for (const doc of otherDocTypes) {
            await prisma.otherDocument.create({
              data: {
                applicationId: application.id,
                documentType: doc.type,
                documentName: doc.name,
                status: "PENDING_SUBMISSION",
              },
            })
          }
        }

        // Create notification for applicant
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "REQUIREMENT_ACCEPTED",
            title: "All Acceptance Requirements Approved",
            message: `All acceptance requirements have been approved! You can now proceed to upload other required documents.`,
            link: `/applications/${application.id}`,
          },
        })
      } else {
        // Some requirements still pending
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "REQUIREMENT_ACCEPTED",
            title: "Requirement Accepted",
            message: `Your "${requirement.requirementName}" has been accepted.`,
            link: `/applications/${application.id}`,
          },
        })
      }

      return NextResponse.json(
        {
          message: "Requirement accepted successfully",
          requirement: updatedRequirement,
          allAccepted,
        },
        { status: 200 }
      )
    } else {
      // REJECT the requirement
      const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS) // 14 working days

      const updatedRequirement = await prisma.acceptanceRequirement.update({
        where: { id: requirementId },
        data: {
          status: "REVISION_REQUIRED",
          reviewedAt: new Date(),
          reviewedBy: adminUser.id,
          adminRemarks,
          adminRemarkFileUrl,
          adminRemarkFileName,
          revisionDeadline,
          // Compliance will be set during evaluation step (EvaluationChecklist)
        },
      })

      // Create notification for applicant
      await prisma.notification.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          type: "REQUIREMENT_REVISION_NEEDED",
          title: "Requirement Needs Revision",
          message: `Your "${requirement.requirementName}" requires revision. ${adminRemarks ? `Admin remarks: ${adminRemarks}` : ""} Please resubmit by ${revisionDeadline.toLocaleDateString()}.`,
          link: `/applications/${application.id}`,
        },
      })

      return NextResponse.json(
        {
          message: "Requirement rejected - revision required",
          requirement: updatedRequirement,
          revisionDeadline,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("Review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
