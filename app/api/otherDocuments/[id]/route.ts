import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Get other documents for an application
 * GET /api/otherDocuments/[id]
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

    const { id: applicationId } = await params

    // Get application to verify access
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { userId: true, status: true }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Verify user has access to this application
    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get other documents
    const documents = await prisma.otherDocument.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({
      documents,
      message: "Other documents retrieved successfully"
    })
  } catch (error) {
    console.error("Error fetching other documents:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
