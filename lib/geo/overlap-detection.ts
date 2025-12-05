/**
 * Coordinate Overlap Detection
 * Checks if project coordinates overlap with existing approved projects
 */

import { prisma } from '@/lib/db'
import type { CoordinatePoint } from './coordinate-validation'

export interface OverlappingProject {
  id: string
  applicationNo: string
  projectName: string | null
  permitType: string
  coordinates: CoordinatePoint[]
  overlapPercentage?: number
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 */
function pointInPolygon(point: CoordinatePoint, polygon: CoordinatePoint[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(
  p1: CoordinatePoint,
  p2: CoordinatePoint,
  p3: CoordinatePoint,
  p4: CoordinatePoint
): boolean {
  const ccw = (a: CoordinatePoint, b: CoordinatePoint, c: CoordinatePoint) => {
    return (c.lng - a.lng) * (b.lat - a.lat) > (b.lng - a.lng) * (c.lat - a.lat)
  }

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  )
}

/**
 * Check if two polygons overlap using various geometric tests
 */
function polygonsOverlap(
  polygon1: CoordinatePoint[],
  polygon2: CoordinatePoint[]
): boolean {
  // Test 1: Check if any vertex of polygon1 is inside polygon2
  for (const point of polygon1) {
    if (pointInPolygon(point, polygon2)) {
      return true
    }
  }

  // Test 2: Check if any vertex of polygon2 is inside polygon1
  for (const point of polygon2) {
    if (pointInPolygon(point, polygon1)) {
      return true
    }
  }

  // Test 3: Check if any edges intersect
  for (let i = 0; i < polygon1.length; i++) {
    const p1 = polygon1[i]
    const p2 = polygon1[(i + 1) % polygon1.length]

    for (let j = 0; j < polygon2.length; j++) {
      const p3 = polygon2[j]
      const p4 = polygon2[(j + 1) % polygon2.length]

      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true
      }
    }
  }

  return false
}

/**
 * Calculate bounding box for a set of coordinates
 */
function calculateBounds(coordinates: CoordinatePoint[]): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  if (coordinates.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 }
  }

  let minLat = coordinates[0].lat
  let maxLat = coordinates[0].lat
  let minLng = coordinates[0].lng
  let maxLng = coordinates[0].lng

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat)
    maxLat = Math.max(maxLat, coord.lat)
    minLng = Math.min(minLng, coord.lng)
    maxLng = Math.max(maxLng, coord.lng)
  }

  return { minLat, maxLat, minLng, maxLng }
}

/**
 * Check if two bounding boxes overlap (quick pre-filter)
 */
function boundsOverlap(
  bounds1: ReturnType<typeof calculateBounds>,
  bounds2: ReturnType<typeof calculateBounds>
): boolean {
  return !(
    bounds1.maxLat < bounds2.minLat ||
    bounds1.minLat > bounds2.maxLat ||
    bounds1.maxLng < bounds2.minLng ||
    bounds1.minLng > bounds2.maxLng
  )
}

/**
 * Check for coordinate overlap with existing approved projects
 * @param coordinates - New project coordinates to check
 * @param excludeApplicationId - Optional application ID to exclude from check (for updates)
 * @returns Array of overlapping projects
 */
export async function checkCoordinateOverlap(
  coordinates: CoordinatePoint[],
  excludeApplicationId?: string
): Promise<OverlappingProject[]> {
  try {
    // Calculate bounding box for quick filtering
    const newBounds = calculateBounds(coordinates)

    // Get all approved applications with coordinates
    // Include: COORDINATE_AUTO_APPROVED, SUBMITTED, APPROVED, PERMIT_ISSUED
    const approvedApplications = await prisma.application.findMany({
      where: {
        AND: [
          {
            id: excludeApplicationId ? { not: excludeApplicationId } : undefined,
          },
          {
            OR: [
              { status: 'COORDINATE_AUTO_APPROVED' },
              { status: 'SUBMITTED' },
              { status: 'ACCEPTANCE_IN_PROGRESS' },
              { status: 'UNDER_REVIEW' },
              { status: 'APPROVED' },
              { status: 'PERMIT_ISSUED' },
            ],
          },
        ],
      },
      select: {
        id: true,
        applicationNo: true,
        projectName: true,
        permitType: true,
        projectCoordinates: true,
      },
    })

    const overlappingProjects: OverlappingProject[] = []

    // Check each approved project for overlap
    for (const app of approvedApplications) {
      try {
        // Parse coordinates (support both array and object formats)
        let appCoordinates: CoordinatePoint[] = []

        if (Array.isArray(app.projectCoordinates)) {
          appCoordinates = app.projectCoordinates as unknown as CoordinatePoint[]
        } else if (app.projectCoordinates && typeof app.projectCoordinates === 'object') {
          // Old format: {point1: {latitude, longitude}, ...}
          const coordObj = app.projectCoordinates as any
          for (let i = 1; i <= 10; i++) {
            const pointKey = `point${i}`
            if (coordObj[pointKey]) {
              appCoordinates.push({
                lat: coordObj[pointKey].latitude || coordObj[pointKey].lat,
                lng: coordObj[pointKey].longitude || coordObj[pointKey].lng,
              })
            }
          }
        }

        if (appCoordinates.length < 3) continue

        // Quick bounding box check
        const appBounds = calculateBounds(appCoordinates)
        if (!boundsOverlap(newBounds, appBounds)) {
          continue
        }

        // Detailed polygon overlap check
        if (polygonsOverlap(coordinates, appCoordinates)) {
          overlappingProjects.push({
            id: app.id,
            applicationNo: app.applicationNo,
            projectName: app.projectName,
            permitType: app.permitType,
            coordinates: appCoordinates,
          })
        }
      } catch (error) {
        console.error(`Error checking overlap for application ${app.id}:`, error)
        // Continue checking other applications
      }
    }

    return overlappingProjects
  } catch (error) {
    console.error('Error in checkCoordinateOverlap:', error)
    throw new Error('Failed to check coordinate overlap')
  }
}

/**
 * Format overlapping projects for display
 */
export function formatOverlappingProjects(projects: OverlappingProject[]): string {
  if (projects.length === 0) return 'No overlapping projects found.'

  return projects
    .map((p, index) => {
      const name = p.projectName || 'Unnamed Project'
      return `${index + 1}. ${name} (${p.applicationNo}) - ${p.permitType}`
    })
    .join('\n')
}
