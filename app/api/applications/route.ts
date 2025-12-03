import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createApplicationSchema } from "@/lib/validations/application"
import { generateApplicationNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const permitType = searchParams.get("permitType")

    const where: any = {
      userId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    if (permitType) {
      where.permitType = permitType
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            documentName: true,
            isComplete: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Validate input
    const validationResult = createApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Generate application number
    const applicationNo = await generateApplicationNumber()

    // Convert string numbers to Decimal for database
    const applicationData: any = {
      applicationNo,
      permitType: data.permitType,
      userId: session.user.id,
      projectName: data.projectName,
      numEmployees: data.numEmployees,
      currentStep: data.currentStep || 1,
      status: "DRAFT",
    }

    if (data.projectArea) {
      applicationData.projectArea = parseFloat(data.projectArea)
    }
    if (data.footprintArea) {
      applicationData.footprintArea = parseFloat(data.footprintArea)
    }
    if (data.projectCost) {
      applicationData.projectCost = parseFloat(data.projectCost)
    }

    const application = await prisma.application.create({
      data: applicationData,
      include: {
        documents: true,
      },
    })

    return NextResponse.json(
      { application },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

