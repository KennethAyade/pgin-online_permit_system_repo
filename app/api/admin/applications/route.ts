import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const permitType = searchParams.get("permitType")
    const assignedTo = searchParams.get("assignedTo")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (permitType) {
      where.permitType = permitType
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
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

