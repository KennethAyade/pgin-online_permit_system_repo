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

    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      returnedApplications,
      isagApplications,
      csagApplications,
      recentApplications,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({
        where: {
          status: {
            in: ["SUBMITTED", "UNDER_REVIEW", "INITIAL_CHECK", "TECHNICAL_REVIEW"],
          },
        },
      }),
      prisma.application.count({
        where: {
          status: {
            in: ["APPROVED", "PERMIT_ISSUED"],
          },
        },
      }),
      prisma.application.count({
        where: { status: "RETURNED" },
      }),
      prisma.application.count({
        where: { permitType: "ISAG" },
      }),
      prisma.application.count({
        where: { permitType: "CSAG" },
      }),
      prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        returned: returnedApplications,
        isag: isagApplications,
        csag: csagApplications,
      },
      recentApplications,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

