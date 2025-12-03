import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  normalizeCoordinates,
  validatePolygonGeometry,
  type CoordinatePoint,
} from "@/lib/geo/coordinate-validation"
import { detectOverlaps } from "@/lib/geo/overlap-detection"
import { getActiveCoordinates } from "@/lib/services/coordinate-history"

/**
 * Validate coordinates for overlaps before submission
 * Phase 2.3: Pre-submission validation endpoint for applicants
 * POST /api/applications/validate-coordinates
 * Body: {
 *   coordinates: Array<{lat, lng}>,
 *   applicationId?: string (optional, to exclude current application)
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

    const body = await request.json()
    const { coordinates, applicationId } = body

    if (!coordinates) {
      return NextResponse.json(
        { error: "Coordinates are required" },
        { status: 400 }
      )
    }

    // Normalize coordinates to standard format
    const normalizedCoordinates = normalizeCoordinates(coordinates)

    if (!normalizedCoordinates || normalizedCoordinates.length < 3) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Invalid coordinates format. At least 3 points required.",
        },
        { status: 400 }
      )
    }

    // Validate polygon geometry (self-intersection, collinearity, etc.)
    const geometryValidation = validatePolygonGeometry(normalizedCoordinates)

    if (!geometryValidation.isValid) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Polygon geometry validation failed",
          validationErrors: geometryValidation.errors,
        },
        { status: 400 }
      )
    }

    // Get all active (approved) coordinates from CoordinateHistory
    const activeCoordinates = await getActiveCoordinates(applicationId)

    // Perform overlap detection using Turf.js
    const overlapResults = await detectOverlaps(
      normalizedCoordinates,
      activeCoordinates,
      applicationId
    )

    // Calculate total metrics
    const hasOverlap = overlapResults.length > 0
    const maxOverlapPercentage = hasOverlap
      ? Math.max(...overlapResults.map((r) => r.overlapPercentage))
      : 0

    // Format overlapping projects info
    const overlappingProjects = overlapResults.map((overlap) => ({
      applicationId: overlap.affectedApplicationId!,
      applicationNo: overlap.affectedApplicationNo!,
      overlapPercentage: overlap.overlapPercentage,
      overlapArea: overlap.overlapArea,
    }))

    return NextResponse.json(
      {
        isValid: true,
        geometryValid: true,
        hasOverlap,
        overlapCount: overlapResults.length,
        maxOverlapPercentage,
        overlappingProjects,
        checkedAgainst: activeCoordinates.length,
        message: hasOverlap
          ? `Your coordinates overlap with ${overlapResults.length} existing approved project(s). Consent may be required.`
          : "Your coordinates do not overlap with any existing approved projects.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error validating coordinates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
