import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Get all pending acceptance requirements for admin review
 * GET /api/admin/acceptanceRequirements/pending
 * Query params: ?skip=0&take=10&permitType=ISAG|CSAG&sortBy=createdAt&order=asc|desc
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 403 }
      )
    }

    // Get query parameters
    const skip = parseInt(request.nextUrl.searchParams.get("skip") || "0")
    const take = parseInt(request.nextUrl.searchParams.get("take") || "10")
    const permitType = request.nextUrl.searchParams.get("permitType")
    const sortBy = request.nextUrl.searchParams.get("sortBy") || "createdAt"
    const order = (request.nextUrl.searchParams.get("order") || "asc") as "asc" | "desc"

    // Build where clause
    const where: any = {
      status: "PENDING_REVIEW",
    }

    if (permitType && ["ISAG", "CSAG"].includes(permitType)) {
      where.application = {
        permitType,
      }
    }

    // Get total count
    const total = await prisma.acceptanceRequirement.count({ where })

    // Get pending requirements
    const requirements = await prisma.acceptanceRequirement.findMany({
      where,
      include: {
        application: {
          include: { user: true },
        },
      },
      skip,
      take,
      orderBy: {
        [sortBy]: order,
      },
    })

    return NextResponse.json(
      {
        requirements: requirements.map((req) => ({
          id: req.id,
          applicationId: req.applicationId,
          applicationNo: req.application.applicationNo,
          projectName: req.application.projectName,
          permitType: req.application.permitType,
          requirementType: req.requirementType,
          requirementName: req.requirementName,
          order: req.order,
          status: req.status,
          submittedAt: req.submittedAt,
          submittedData: req.submittedData,
          submittedFileName: req.submittedFileName,
          autoAcceptDeadline: req.autoAcceptDeadline,
          daysUntilAutoAccept: req.autoAcceptDeadline
            ? Math.ceil(
                (req.autoAcceptDeadline.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
          applicant: {
            id: req.application.user.id,
            fullName: req.application.user.fullName,
            email: req.application.user.email,
          },
        })),
        pagination: {
          skip,
          take,
          total,
          pages: Math.ceil(total / take),
        },
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
