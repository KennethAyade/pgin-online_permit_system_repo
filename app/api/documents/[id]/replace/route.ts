import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { saveFile, validateFile, deleteFile } from "@/lib/upload"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Get existing document
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user owns the application
    if (existingDocument.application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Allow replacement in draft and returned/for-action applications
    const allowedStatuses = ["DRAFT", "RETURNED", "FOR_ACTION"] as const
    if (!allowedStatuses.includes(existingDocument.application.status as any)) {
      return NextResponse.json(
        { error: "Cannot replace document for this application status" },
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

    // Delete old file
    await deleteFile(existingDocument.fileUrl)

    // Save new file with incremented version
    const newVersion = existingDocument.version + 1
    const uploadResult = await saveFile(
      file,
      existingDocument.applicationId,
      existingDocument.documentType,
      newVersion
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload file" },
        { status: 500 }
      )
    }

    // Mark old document as replaced
    await prisma.document.update({
      where: { id },
      data: { replacedAt: new Date() },
    })

    // Create new document record
    const newDocument = await prisma.document.create({
      data: {
        applicationId: existingDocument.applicationId,
        documentType: existingDocument.documentType,
        documentName: existingDocument.documentName,
        fileName: uploadResult.fileName || file.name,
        fileUrl: uploadResult.fileUrl || "",
        fileSize: file.size,
        mimeType: file.type,
        setNumber: existingDocument.setNumber,
        version: newVersion,
        uploadedBy: session.user.id,
        isComplete: true,
      },
    })

    return NextResponse.json({
      document: newDocument,
      message: "Document replaced successfully",
    })
  } catch (error) {
    console.error("Error replacing document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

