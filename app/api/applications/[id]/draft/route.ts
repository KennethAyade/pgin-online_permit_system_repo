import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updateApplicationSchema } from "@/lib/validations/application"

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

    const body = await request.json()

    // Validate input
    const validationResult = updateApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      console.error("Draft validation failed:", {
        applicationId: id,
        status: existingApplication.status,
        errors: validationResult.error.errors,
      })
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Check if application exists and belongs to user
    const existingApplication = await prisma.application.findUnique({
      where: { id },
    })

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (existingApplication.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Allow draft updates for applications that can be edited.
    //
    // This includes:
    // - DRAFT: initial creation / early steps of the wizard
    // - RETURNED / FOR_ACTION: application sent back to applicant
    // - COORDINATE_REVISION_REQUIRED: applicant revising coordinates
    // - OVERLAP_DETECTED_PENDING_CONSENT: uploading consent letters
    // - COORDINATE_AUTO_APPROVED: coordinates auto-approved, applicant
    //   still completing project info and bulk upload
    // - ACCEPTANCE_IN_PROGRESS: acceptance phase in progress (wizard is
    //   effectively locked, but auto-save / minor field updates must
    //   still not 400).
    const editableStatuses = [
      "DRAFT",
      "RETURNED",
      "FOR_ACTION",
      "COORDINATE_REVISION_REQUIRED",
      "OVERLAP_DETECTED_PENDING_CONSENT",
      "COORDINATE_AUTO_APPROVED",
      "ACCEPTANCE_IN_PROGRESS",
      "PENDING_OTHER_DOCUMENTS",  // Allow draft updates during Other Documents phase
    ] as const

    if (!editableStatuses.includes(existingApplication.status as any)) {
      return NextResponse.json(
        { error: "Cannot update submitted application" },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Convert string numbers to Decimal for database
    const updateData: any = {}

    if (data.projectName !== undefined) updateData.projectName = data.projectName
    if (data.numEmployees !== undefined) updateData.numEmployees = data.numEmployees
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep
    if (data.permitType !== undefined) updateData.permitType = data.permitType

    if (data.projectArea !== undefined) {
      updateData.projectArea = parseFloat(data.projectArea)
    }
    if (data.footprintArea !== undefined) {
      updateData.footprintArea = parseFloat(data.footprintArea)
    }
    if (data.projectCost !== undefined) {
      updateData.projectCost = parseFloat(data.projectCost)
    }
    if (data.projectCoordinates !== undefined) {
      updateData.projectCoordinates = data.projectCoordinates
    }
    if (data.uploadedDocuments !== undefined) {
      updateData.uploadedDocuments = data.uploadedDocuments
    }

    // Auto-save: update without changing status
    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        documents: true,
      },
    })

    return NextResponse.json({
      application,
      message: "Draft saved successfully",
    })
  } catch (error) {
    console.error("Error saving draft:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

