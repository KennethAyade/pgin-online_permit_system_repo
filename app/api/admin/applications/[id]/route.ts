import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id || (session.user as any).role !== "admin") {
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
            mobileNumber: true,
            address: true,
          },
        },
        documents: {
          orderBy: { documentType: "asc" },
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

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

