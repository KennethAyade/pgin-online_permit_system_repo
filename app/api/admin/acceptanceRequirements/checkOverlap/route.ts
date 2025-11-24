import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Check if submitted coordinates overlap with existing approved projects
 * POST /api/admin/acceptanceRequirements/checkOverlap
 * Body: { coordinates: { point1: {lat, lng}, point2: {lat, lng}, point3: {lat, lng}, point4: {lat, lng} }, applicationId: string }
 */

interface Point {
  latitude: number
  longitude: number
}

interface Coordinates {
  point1: Point
  point2: Point
  point3: Point
  point4: Point
}

// Helper function to check if two line segments intersect
function doLinesIntersect(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): boolean {
  const ccw = (A: Point, B: Point, C: Point): boolean => {
    return (C.latitude - A.latitude) * (B.longitude - A.longitude) >
           (B.latitude - A.latitude) * (C.longitude - A.longitude)
  }

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  )
}

// Helper function to check if a point is inside a polygon
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude
    const xj = polygon[j].longitude, yj = polygon[j].latitude

    if (
      ((yi > point.latitude) !== (yj > point.latitude)) &&
      (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi)
    ) {
      inside = !inside
    }
  }

  return inside
}

// Check if two polygons overlap
function doPolygonsOverlap(poly1: Point[], poly2: Point[]): boolean {
  // Check if any vertex of poly1 is inside poly2
  for (const point of poly1) {
    if (isPointInPolygon(point, poly2)) {
      return true
    }
  }

  // Check if any vertex of poly2 is inside poly1
  for (const point of poly2) {
    if (isPointInPolygon(point, poly1)) {
      return true
    }
  }

  // Check if any edges intersect
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i]
    const p2 = poly1[(i + 1) % poly1.length]

    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j]
      const p4 = poly2[(j + 1) % poly2.length]

      if (doLinesIntersect(p1, p2, p3, p4)) {
        return true
      }
    }
  }

  return false
}

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

    // Parse submitted coordinates into polygon
    const submittedPolygon: Point[] = [
      coordinates.point1,
      coordinates.point2,
      coordinates.point3,
      coordinates.point4,
    ]

    // Find all approved applications with accepted PROJECT_COORDINATES
    // Exclude the current application being checked
    const approvedCoordinates = await prisma.acceptanceRequirement.findMany({
      where: {
        requirementType: "PROJECT_COORDINATES",
        status: "ACCEPTED",
        submittedData: { not: null },
        applicationId: { not: applicationId },
        application: {
          status: {
            notIn: ["VOIDED", "REJECTED"],
          },
        },
      },
      include: {
        application: {
          select: {
            id: true,
            applicationNo: true,
            projectName: true,
            permitType: true,
          },
        },
      },
    })

    const overlappingProjects: Array<{
      applicationId: string
      applicationNo: string
      projectName: string | null
      permitType: string
    }> = []

    // Check each approved coordinate set for overlap
    for (const approved of approvedCoordinates) {
      if (!approved.submittedData) continue

      try {
        const existingCoords = JSON.parse(approved.submittedData) as Coordinates
        const existingPolygon: Point[] = [
          existingCoords.point1,
          existingCoords.point2,
          existingCoords.point3,
          existingCoords.point4,
        ]

        if (doPolygonsOverlap(submittedPolygon, existingPolygon)) {
          overlappingProjects.push({
            applicationId: approved.application.id,
            applicationNo: approved.application.applicationNo,
            projectName: approved.application.projectName,
            permitType: approved.application.permitType,
          })
        }
      } catch (parseError) {
        // Skip invalid coordinate data
        console.error(`Failed to parse coordinates for ${approved.id}:`, parseError)
      }
    }

    return NextResponse.json(
      {
        hasOverlap: overlappingProjects.length > 0,
        overlappingProjects,
        checkedAgainst: approvedCoordinates.length,
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
