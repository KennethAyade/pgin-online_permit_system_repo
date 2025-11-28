import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Submit an other document
 * POST /api/otherDocuments/submit
 * Body: { documentId: string, submittedFileUrl: string, submittedFileName: string }
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
    const { documentId, submittedFileUrl, submittedFileName } = body

    if (!documentId || !submittedFileUrl || !submittedFileName) {
      return NextResponse.json(
        { error: "Document ID, file URL, and file name are required" },
        { status: 400 }
      )
    }

    // Get document
    const document = await prisma.otherDocument.findUnique({
      where: { id: documentId },
      include: { application: { include: { user: true } } }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Verify ownership
    if (document.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Check if document can be submitted
    if (document.status !== "PENDING_SUBMISSION" && document.status !== "REVISION_REQUIRED") {
      return NextResponse.json(
        { error: `Cannot submit document in ${document.status} status` },
        { status: 409 }
      )
    }

    // Check if application is in valid state
    const application = document.application
    if (application.status === "VOIDED") {
      return NextResponse.json(
        { error: "Application has been voided" },
        { status: 409 }
      )
    }

    // Update document status to PENDING_REVIEW
    const updatedDocument = await prisma.otherDocument.update({
      where: { id: documentId },
      data: {
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        submittedBy: session.user.id,
        submittedFileUrl,
        submittedFileName,
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
        title: "Other Document Submitted",
        message: `Your "${document.documentName}" has been submitted for admin review.`,
        link: `/applications/${application.id}`,
      },
    })

    return NextResponse.json(
      {
        message: "Document submitted successfully",
        document: updatedDocument,
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
