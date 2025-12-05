import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"
import {
  normalizeCoordinates,
  validatePolygonGeometry,
  type CoordinatePoint
} from "@/lib/geo/coordinate-validation"
import { checkCoordinateOverlap } from "@/lib/geo/overlap-detection"

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

    // Get coordinates from request (support both old and new formats)
    const { projectCoordinates } = body

    if (!projectCoordinates) {
      return NextResponse.json(
        { error: "Project coordinates are required" },
        { status: 400 }
      )
    }

    // Normalize coordinates to array format (handles both old and new formats)
    const coordinates = normalizeCoordinates(projectCoordinates)

    if (!coordinates || coordinates.length === 0) {
      return NextResponse.json(
        { error: "Invalid coordinate format" },
        { status: 400 }
      )
    }

    // Validate polygon geometry (min 3 points, no self-intersection, etc.)
    const validation = validatePolygonGeometry(coordinates)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Coordinate validation failed",
          validationErrors: validation.errors
        },
        { status: 400 }
      )
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

    // Only allow submission from DRAFT, COORDINATE_REVISION_REQUIRED, or OVERLAP_DETECTED_PENDING_CONSENT
    if (existingApplication.status !== "DRAFT" &&
        existingApplication.status !== "COORDINATE_REVISION_REQUIRED" &&
        existingApplication.status !== "OVERLAP_DETECTED_PENDING_CONSENT") {
      return NextResponse.json(
        { error: "Coordinates can only be submitted from DRAFT or COORDINATE_REVISION_REQUIRED status" },
        { status: 400 }
      )
    }

    // Check for overlaps with existing approved projects
    const overlappingProjects = await checkCoordinateOverlap(coordinates, id)

    let newStatus: string
    let coordinateApprovedAt: Date | null = null
    let coordinateAutoApproved = false
    let statusMessage: string

    if (overlappingProjects.length === 0) {
      // No overlap detected - auto-approve
      newStatus = "COORDINATE_AUTO_APPROVED"
      coordinateApprovedAt = new Date()
      coordinateAutoApproved = true
      statusMessage = "Coordinates verified - no overlap detected. Auto-approved."
    } else {
      // Overlap detected - require consent letter
      newStatus = "OVERLAP_DETECTED_PENDING_CONSENT"
      statusMessage = `Overlap detected with ${overlappingProjects.length} existing project(s). Please upload a consent letter from the permit holder(s).`
    }

    // Store coordinates in new array format
    const application = await prisma.application.update({
      where: { id },
      data: {
        projectCoordinates: coordinates as any, // Store as array of {lat, lng} points
        status: newStatus as any,
        coordinateApprovedAt,
        coordinateAutoApproved,
        overlappingProjectIds: overlappingProjects.length > 0
          ? overlappingProjects.map(p => p.id) as any
          : null,
        coordinateReviewDeadline: overlappingProjects.length > 0
          ? addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS)
          : null,
        coordinateRevisionDeadline: null, // Clear any previous revision deadline
        coordinateReviewRemarks: null, // Clear any previous remarks
      },
    })

    // Create status history entry
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: existingApplication.status,
        toStatus: newStatus as any,
        changedBy: session.user.id,
        changedByRole: "APPLICANT",
        remarks: overlappingProjects.length === 0
          ? `Coordinates auto-approved (${coordinates.length} points, no overlap)`
          : `Overlap detected with ${overlappingProjects.length} project(s) - consent letter required`,
      },
    })

    // Create notifications
    const adminUsers = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    if (overlappingProjects.length > 0) {
      // Only notify admins if overlap detected
      const overlappingProjectsList = overlappingProjects
        .map(p => `${p.projectName || 'Unnamed'} (${p.applicationNo})`)
        .join(', ')

      await prisma.notification.createMany({
        data: adminUsers.map(admin => ({
          adminUserId: admin.id,
          applicationId: id,
          type: "COORDINATES_SUBMITTED" as any,
          title: "Coordinates with Overlap Detected",
          message: `Application ${application.applicationNo} has overlapping coordinates with: ${overlappingProjectsList}. Consent letter required for approval.`,
          link: `/admin/applications/${id}`,
        })),
      })
    }

    return NextResponse.json({
      application,
      message: statusMessage,
      status: newStatus,
      pointCount: coordinates.length,
      overlappingProjects: overlappingProjects.length > 0 ? overlappingProjects : undefined,
      autoApproved: coordinateAutoApproved,
    })
  } catch (error) {
    console.error("Error submitting coordinates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
