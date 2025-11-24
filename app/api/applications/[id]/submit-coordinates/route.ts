import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

export async function POST(
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

    // Validate coordinates structure
    const { projectCoordinates } = body
    if (!projectCoordinates ||
        !projectCoordinates.point1 || !projectCoordinates.point2 ||
        !projectCoordinates.point3 || !projectCoordinates.point4) {
      return NextResponse.json(
        { error: "All 4 coordinate points are required" },
        { status: 400 }
      )
    }

    // Validate each point has latitude and longitude
    for (let i = 1; i <= 4; i++) {
      const point = projectCoordinates[`point${i}`]
      if (!point.latitude || !point.longitude) {
        return NextResponse.json(
          { error: `Point ${i} must have both latitude and longitude` },
          { status: 400 }
        )
      }
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

    // Only allow submission from DRAFT or COORDINATE_REVISION_REQUIRED status
    if (existingApplication.status !== "DRAFT" &&
        existingApplication.status !== "COORDINATE_REVISION_REQUIRED") {
      return NextResponse.json(
        { error: "Coordinates can only be submitted from DRAFT or COORDINATE_REVISION_REQUIRED status" },
        { status: 400 }
      )
    }

    // Calculate admin review deadline (14 working days)
    const coordinateReviewDeadline = addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS)

    // Update application with coordinates and change status
    const application = await prisma.application.update({
      where: { id },
      data: {
        projectCoordinates,
        status: "PENDING_COORDINATE_APPROVAL",
        coordinateReviewDeadline,
        coordinateRevisionDeadline: null, // Clear any previous revision deadline
        coordinateReviewRemarks: null, // Clear any previous remarks
      },
    })

    // Create status history entry
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: existingApplication.status,
        toStatus: "PENDING_COORDINATE_APPROVAL",
        changedBy: session.user.id,
        changedByRole: "APPLICANT",
        remarks: "Project coordinates submitted for admin review",
      },
    })

    // Create notification for admin(s)
    const adminUsers = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    // Create notifications for all active admins
    await prisma.notification.createMany({
      data: adminUsers.map(admin => ({
        adminUserId: admin.id,
        applicationId: id,
        type: "COORDINATES_SUBMITTED",
        title: "New Coordinates for Review",
        message: `Application ${application.applicationNo} has submitted project coordinates for review. Please verify there is no overlap with existing projects.`,
        link: `/admin/applications/${id}`,
      })),
    })

    return NextResponse.json({
      application,
      message: "Coordinates submitted for review successfully",
      reviewDeadline: coordinateReviewDeadline,
    })
  } catch (error) {
    console.error("Error submitting coordinates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
