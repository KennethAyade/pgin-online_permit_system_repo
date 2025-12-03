/**
 * Overlap Detection Utilities
 * Phase 2.3: Automated overlap detection using Turf.js
 */

import * as turf from '@turf/turf'
import type { CoordinatePoint } from './coordinate-validation'
import {
  coordinatesToGeoJSON,
  calculateBoundingBox,
  doBoundingBoxesOverlap,
  type BoundingBox,
} from './polygon-helpers'

export interface OverlapResult {
  hasOverlap: boolean
  affectedApplicationId?: string
  affectedApplicationNo?: string
  overlapPercentage: number
  overlapArea?: number // in square meters
  overlapGeoJSON?: any // GeoJSON Feature<Polygon>
}

export interface CoordinateData {
  applicationId: string
  applicationNo: string
  coordinates: CoordinatePoint[]
  bounds: BoundingBox
}

/**
 * Check if two polygons overlap using Turf.js
 */
export function checkPolygonOverlap(
  polygon1: any, // GeoJSON Feature<Polygon>
  polygon2: any  // GeoJSON Feature<Polygon>
): {
  hasOverlap: boolean
  overlapPercentage: number
  overlapArea?: number
  intersection?: any // GeoJSON Feature<Polygon>
} {
  // First check if polygons intersect at all
  const intersects = turf.booleanIntersects(polygon1, polygon2)

  if (!intersects) {
    return {
      hasOverlap: false,
      overlapPercentage: 0,
    }
  }

  // Calculate intersection polygon
  const intersection = turf.intersect(
    turf.featureCollection([polygon1, polygon2])
  )

  if (!intersection) {
    return {
      hasOverlap: false,
      overlapPercentage: 0,
    }
  }

  // Calculate areas
  const area1 = turf.area(polygon1) // in square meters
  const area2 = turf.area(polygon2)
  const overlapArea = turf.area(intersection)

  // Calculate overlap percentage relative to the smaller polygon
  const smallerArea = Math.min(area1, area2)
  const overlapPercentage = (overlapArea / smallerArea) * 100

  return {
    hasOverlap: true,
    overlapPercentage: Math.round(overlapPercentage * 100) / 100, // Round to 2 decimals
    overlapArea: Math.round(overlapArea * 100) / 100,
    intersection: intersection as any,
  }
}

/**
 * Detect overlaps with existing approved coordinates
 * Uses bounding box pre-filtering for performance
 */
export async function detectOverlaps(
  newCoordinates: CoordinatePoint[],
  existingCoordinates: CoordinateData[],
  excludeApplicationId?: string
): Promise<OverlapResult[]> {
  const overlaps: OverlapResult[] = []

  // Convert new coordinates to GeoJSON
  const newPolygon = coordinatesToGeoJSON(newCoordinates, {
    type: 'new',
  })

  // Calculate bounding box for new polygon
  const newBounds = calculateBoundingBox(newCoordinates)

  // Filter candidates using bounding box (fast pre-check)
  const candidates = existingCoordinates.filter((existing) => {
    // Skip if it's the same application
    if (excludeApplicationId && existing.applicationId === excludeApplicationId) {
      return false
    }

    // Quick bounding box check
    return doBoundingBoxesOverlap(newBounds, existing.bounds)
  })

  // Detailed polygon overlap check for candidates
  for (const candidate of candidates) {
    const existingPolygon = coordinatesToGeoJSON(candidate.coordinates, {
      applicationId: candidate.applicationId,
      applicationNo: candidate.applicationNo,
    })

    const overlapCheck = checkPolygonOverlap(newPolygon, existingPolygon)

    if (overlapCheck.hasOverlap) {
      overlaps.push({
        hasOverlap: true,
        affectedApplicationId: candidate.applicationId,
        affectedApplicationNo: candidate.applicationNo,
        overlapPercentage: overlapCheck.overlapPercentage,
        overlapArea: overlapCheck.overlapArea,
        overlapGeoJSON: overlapCheck.intersection,
      })
    }
  }

  return overlaps
}

/**
 * Calculate total overlap area across multiple overlapping polygons
 */
export function calculateTotalOverlapArea(overlaps: OverlapResult[]): number {
  return overlaps.reduce((total, overlap) => {
    return total + (overlap.overlapArea || 0)
  }, 0)
}

/**
 * Get the maximum overlap percentage from multiple overlaps
 */
export function getMaxOverlapPercentage(overlaps: OverlapResult[]): number {
  if (overlaps.length === 0) return 0

  return Math.max(...overlaps.map((overlap) => overlap.overlapPercentage))
}

/**
 * Check if overlap percentage exceeds threshold
 */
export function isSignificantOverlap(
  overlapPercentage: number,
  threshold: number = 1 // 1% threshold by default
): boolean {
  return overlapPercentage >= threshold
}

/**
 * Format overlap information for display
 */
export function formatOverlapInfo(overlap: OverlapResult): string {
  const { affectedApplicationNo, overlapPercentage, overlapArea } = overlap

  let info = `Application ${affectedApplicationNo}: ${overlapPercentage}% overlap`

  if (overlapArea) {
    // Convert to hectares if area is large
    if (overlapArea > 10000) {
      const hectares = (overlapArea / 10000).toFixed(2)
      info += ` (${hectares} hectares)`
    } else {
      info += ` (${overlapArea.toFixed(2)} m²)`
    }
  }

  return info
}

/**
 * Validate polygon area meets minimum requirement
 */
export function validateMinimumArea(
  coordinates: CoordinatePoint[],
  minimumAreaInSquareMeters: number = 1000 // 1000 m² default (0.1 hectare)
): { isValid: boolean; area: number; message?: string } {
  const polygon = coordinatesToGeoJSON(coordinates)
  const area = turf.area(polygon)

  if (area < minimumAreaInSquareMeters) {
    return {
      isValid: false,
      area,
      message: `Project area (${area.toFixed(2)} m²) is below minimum requirement (${minimumAreaInSquareMeters} m²)`,
    }
  }

  return {
    isValid: true,
    area,
  }
}

/**
 * Check if polygon is convex (all interior angles < 180°)
 * Convex polygons are simpler and less likely to have issues
 */
export function isConvexPolygon(coordinates: CoordinatePoint[]): boolean {
  const polygon = coordinatesToGeoJSON(coordinates)

  try {
    // A polygon is convex if it equals its convex hull
    const hull = turf.convex(turf.featureCollection([polygon]))

    if (!hull) return false

    const originalArea = turf.area(polygon)
    const hullArea = turf.area(hull)

    // Allow small floating-point differences
    return Math.abs(originalArea - hullArea) < 0.01
  } catch (error) {
    return false
  }
}
