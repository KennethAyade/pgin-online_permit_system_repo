import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { saveFile, validateFile } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string
    const documentType = formData.get("documentType") as string
    const documentName = formData.get("documentName") as string
    const setNumber = formData.get("setNumber") ? parseInt(formData.get("setNumber") as string) : null

    if (!file || !applicationId || !documentType || !documentName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if application exists and belongs to user
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Allow document uploads for draft, returned, for-action, and overlap-related statuses
    const allowedStatuses = [
      "DRAFT",                                  // Initial creation
      "RETURNED",                               // Returned for revisions
      "FOR_ACTION",                             // Awaiting applicant action
      "OVERLAP_DETECTED_PENDING_CONSENT",       // Uploading consent letters
      "COORDINATE_REVISION_REQUIRED",           // Resubmitting coordinates
      "ACCEPTANCE_IN_PROGRESS",                 // During acceptance requirements review
      "PENDING_OTHER_DOCUMENTS",                // Uploading other documents
    ] as const
    if (!allowedStatuses.includes(application.status as any)) {
      return NextResponse.json(
        { error: "Cannot upload documents for this application status" },
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

    // Check if document already exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        applicationId,
        documentType: documentType as any,
        setNumber: setNumber || null,
      },
      orderBy: { version: "desc" },
    })

    const version = existingDoc ? existingDoc.version + 1 : 1

    // Save file
    const uploadResult = await saveFile(file, applicationId, documentType, version)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload file" },
        { status: 500 }
      )
    }

    // If document exists, mark old version as replaced
    if (existingDoc) {
      await prisma.document.update({
        where: { id: existingDoc.id },
        data: { replacedAt: new Date() },
      })
    }

    // Create or update document record
    const document = await prisma.document.create({
      data: {
        applicationId,
        documentType: documentType as any,
        documentName,
        fileName: uploadResult.fileName || file.name,
        fileUrl: uploadResult.fileUrl || "",
        fileSize: file.size,
        mimeType: file.type,
        setNumber: setNumber || null,
        version,
        uploadedBy: session.user.id,
        isComplete: true,
      },
    })

    return NextResponse.json(
      { document },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

