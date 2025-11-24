import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin access
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Get applications pending coordinate approval
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: {
          status: "PENDING_COORDINATE_APPROVAL",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Oldest first (FIFO)
        },
        skip,
        take: limit,
      }),
      prisma.application.count({
        where: {
          status: "PENDING_COORDINATE_APPROVAL",
        },
      }),
    ])

    // Format the response
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      applicationNo: app.applicationNo,
      permitType: app.permitType,
      projectName: app.projectName,
      projectCoordinates: app.projectCoordinates,
      coordinateReviewDeadline: app.coordinateReviewDeadline,
      createdAt: app.createdAt,
      user: {
        id: app.user.id,
        fullName: app.user.fullName,
        email: app.user.email,
        companyName: app.user.companyName,
      },
    }))

    return NextResponse.json({
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching pending coordinates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
