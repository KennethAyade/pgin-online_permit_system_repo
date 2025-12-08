import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Get other documents for an application (admin)
 * GET /api/admin/otherDocuments/[id]
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

    const { id: applicationId } = await params

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    const documents = await prisma.otherDocument.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      documents,
      message: "Other documents retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching other documents (admin):", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}