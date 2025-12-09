import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updateApplicationSchema } from "@/lib/validations/application"

export async function GET(
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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        documents: {
          orderBy: { documentType: "asc" },
        },
        otherDocuments: {
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            replies: true,
          },
          orderBy: { createdAt: "desc" },
        },
        evaluations: {
          include: {
            checklistItems: true,
            evaluator: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check if user owns this application or is admin
    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Only allow updates to DRAFT applications
    if (existingApplication.status !== "DRAFT") {
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

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        documents: true,
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if application exists and belongs to user
    const application = await prisma.application.findUnique({
      where: { id },
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

    // Only allow deletion of DRAFT applications
    if (application.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot delete submitted application" },
        { status: 400 }
      )
    }

    await prisma.application.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Application deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

