import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Get all acceptance requirements for an application
 * GET /api/acceptanceRequirements/[id]
 * Query params: ?applicationType=user|admin
 */

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
    const applicationId = id
    const applicationType = request.nextUrl.searchParams.get("type") || "user"

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        acceptanceRequirements: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Verify authorization
    if (applicationType === "user" && application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    if (applicationType === "admin") {
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: session.user.id },
      })
      if (!adminUser) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      {
        application: {
          id: application.id,
          applicationNo: application.applicationNo,
          projectName: application.projectName,
          permitType: application.permitType,
          status: application.status,
          currentAcceptanceRequirementId: application.currentAcceptanceRequirementId,
          acceptanceRequirementsStartedAt: application.acceptanceRequirementsStartedAt,
        },
        requirements: application.acceptanceRequirements,
        total: application.acceptanceRequirements.length,
        completed: application.acceptanceRequirements.filter(
          (r) => r.status === "ACCEPTED"
        ).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
