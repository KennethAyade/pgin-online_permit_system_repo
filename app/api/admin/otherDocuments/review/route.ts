import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { REVISION_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Admin review of other document - Accept or Reject
 * POST /api/admin/otherDocuments/review
 * Body: {
 *   documentId: string,
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
    const { documentId, decision, adminRemarks, adminRemarkFileUrl, adminRemarkFileName, isCompliant } = body

    if (!documentId || !decision) {
      return NextResponse.json(
        { error: "Document ID and decision are required" },
        { status: 400 }
      )
    }

    if (!["ACCEPT", "REJECT"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be either ACCEPT or REJECT" },
        { status: 400 }
      )
    }

    // Get document
    const document = await prisma.otherDocument.findUnique({
      where: { id: documentId },
      include: { application: { include: { user: true } } },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if in correct state for review
    if (document.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: `Cannot review document in ${document.status} status` },
        { status: 409 }
      )
    }

    const application = document.application

    if (decision === "ACCEPT") {
      // ACCEPT the document
      const updatedDocument = await prisma.otherDocument.update({
        where: { id: documentId },
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

      // Check if ALL other documents are now ACCEPTED
      const allDocuments = await prisma.otherDocument.findMany({
        where: { applicationId: application.id },
      })

      const allAccepted = allDocuments.every(doc => doc.status === "ACCEPTED")

      if (allAccepted) {
        // All other documents are accepted - move to next phase
        await prisma.application.update({
          where: { id: application.id },
          data: {
            status: "UNDER_REVIEW",
          },
        })

        // Create notification for applicant
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "REQUIREMENT_ACCEPTED",
            title: "All Other Documents Approved",
            message: `All other documents have been approved! Your application will now proceed to evaluation.`,
            link: `/applications/${application.id}`,
          },
        })
      } else {
        // Some documents still pending
        await prisma.notification.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            type: "REQUIREMENT_ACCEPTED",
            title: "Other Document Accepted",
            message: `Your "${document.documentName}" has been accepted.`,
            link: `/applications/${application.id}`,
          },
        })
      }

      return NextResponse.json(
        {
          message: "Document accepted successfully",
          document: updatedDocument,
          allAccepted,
        },
        { status: 200 }
      )
    } else {
      // REJECT the document
      const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS) // 14 working days

      const updatedDocument = await prisma.otherDocument.update({
        where: { id: documentId },
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
          title: "Other Document Needs Revision",
          message: `Your "${document.documentName}" requires revision. ${adminRemarks ? `Admin remarks: ${adminRemarks}` : ""} Please resubmit by ${revisionDeadline.toLocaleDateString()}.`,
          link: `/applications/${application.id}`,
        },
      })

      return NextResponse.json(
        {
          message: "Document rejected - revision required",
          document: updatedDocument,
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
