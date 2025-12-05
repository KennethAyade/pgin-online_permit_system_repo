import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { normalizeCoordinates, type CoordinatePoint } from "@/lib/geo/coordinate-validation"
import { checkCoordinateOverlap, type OverlappingProject } from "@/lib/geo/overlap-detection"
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

    // Perform overlap detection
    const overlapResults = await checkCoordinateOverlap(
      normalizedCoordinates,
      applicationId
    )

    // Format response for backward compatibility
    const overlappingProjects = overlapResults.map((overlap) => ({
      applicationId: overlap.id,
      applicationNo: overlap.applicationNo,
      projectName: overlap.projectName,
      permitType: overlap.permitType,
      overlapPercentage: overlap.overlapPercentage || 100, // Default if not calculated
      overlapArea: null, // Not calculated by current function
      overlapGeoJSON: null, // Not calculated by current function
    }))

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
