import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { saveFile, validateFile } from "@/lib/upload"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Upload file for Other Document
 * POST /api/otherDocuments/upload
 * Body: FormData {
 *   file: File,
 *   documentId: string,
 *   applicationId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentId = formData.get("documentId") as string
    const applicationId = formData.get("applicationId") as string

    if (!file || !documentId || !applicationId) {
      return NextResponse.json(
        { error: "File, documentId, and applicationId are required" },
        { status: 400 }
      )
    }

    // Validate file
    const validation = await validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get OtherDocument and verify ownership
    const otherDocument = await prisma.otherDocument.findUnique({
      where: { id: documentId },
      include: { application: true },
    })

    if (!otherDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    if (otherDocument.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Verify document can be uploaded (not already submitted for review)
    if (otherDocument.status !== "PENDING_SUBMISSION" && otherDocument.status !== "REVISION_REQUIRED") {
      return NextResponse.json(
        { error: `Cannot upload document in ${otherDocument.status} status` },
        { status: 409 }
      )
    }

    // Save file
    const uploadResult = await saveFile(
      file,
      applicationId,
      otherDocument.documentType,
      1  // Version number (OtherDocuments don't version, always use 1)
    )

    // Check upload success
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload file" },
        { status: 500 }
      )
    }

    // Update OtherDocument with file info and change status to PENDING_REVIEW
    const updatedDocument = await prisma.otherDocument.update({
      where: { id: documentId },
      data: {
        submittedFileUrl: uploadResult.fileUrl || "",
        submittedFileName: uploadResult.fileName || file.name,
        submittedAt: new Date(),
        submittedBy: session.user.id,
        status: "PENDING_REVIEW",
        // Set auto-accept deadline (14 working days)
        autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
      },
    })

    // Create notification for applicant
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        applicationId,
        type: "REQUIREMENT_PENDING_REVIEW",
        title: "Document Submitted",
        message: `Your "${otherDocument.documentName}" has been submitted for review.`,
        link: `/applications/${applicationId}`,
      },
    })

    return NextResponse.json(
      {
        message: "Document uploaded successfully",
        document: updatedDocument,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error uploading other document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
