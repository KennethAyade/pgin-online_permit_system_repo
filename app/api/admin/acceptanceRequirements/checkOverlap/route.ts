import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { normalizeCoordinates, type CoordinatePoint } from "@/lib/geo/coordinate-validation"
import { detectOverlaps } from "@/lib/geo/overlap-detection"
import { getActiveCoordinates } from "@/lib/services/coordinate-history"

/**
 * Check if submitted coordinates overlap with existing approved projects
 * Phase 2.3: Updated to use Turf.js-based overlap detection with CoordinateHistory
 * POST /api/admin/acceptanceRequirements/checkOverlap
 * Body: {
 *   coordinates: Array<{lat, lng}> | { point1: {latitude, longitude}, ... } (backward compatible),
 *   applicationId: string
 * }
 */

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { coordinates, applicationId } = body

    if (!coordinates) {
      return NextResponse.json(
        { error: "Coordinates are required" },
        { status: 400 }
      )
    }

    // Normalize coordinates (handles both old and new formats)
    const normalizedCoordinates = normalizeCoordinates(coordinates)

    if (!normalizedCoordinates || normalizedCoordinates.length < 3) {
      return NextResponse.json(
        { error: "Invalid coordinates format. At least 3 points required." },
        { status: 400 }
      )
    }

    // Get all active (approved) coordinates from CoordinateHistory
    // Phase 2.3: This replaces querying AcceptanceRequirement
    const activeCoordinates = await getActiveCoordinates(applicationId)

    // Perform overlap detection using Turf.js
    // Phase 2.3: Uses bounding box pre-filtering and accurate polygon intersection
    const overlapResults = await detectOverlaps(
      normalizedCoordinates,
      activeCoordinates,
      applicationId
    )

    // Format response for backward compatibility
    const overlappingProjects = await Promise.all(
      overlapResults.map(async (overlap) => {
        // Get application details for each overlap
        const application = await prisma.application.findUnique({
          where: { id: overlap.affectedApplicationId! },
          select: {
            id: true,
            applicationNo: true,
            projectName: true,
            permitType: true,
          },
        })

        return {
          applicationId: overlap.affectedApplicationId!,
          applicationNo: overlap.affectedApplicationNo!,
          projectName: application?.projectName || null,
          permitType: application?.permitType || '',
          overlapPercentage: overlap.overlapPercentage,
          overlapArea: overlap.overlapArea, // in square meters
          overlapGeoJSON: overlap.overlapGeoJSON,
        }
      })
    )

    return NextResponse.json(
      {
        hasOverlap: overlappingProjects.length > 0,
        overlappingProjects,
        checkedAgainst: activeCoordinates.length,
        // Phase 2.3: Enhanced response with detailed overlap information
        totalOverlaps: overlappingProjects.length,
        maxOverlapPercentage: overlappingProjects.length > 0
          ? Math.max(...overlappingProjects.map(p => p.overlapPercentage))
          : 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Overlap check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
