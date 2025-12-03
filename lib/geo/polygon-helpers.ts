/**
 * Polygon Helper Utilities
 * Phase 2: Geometric calculations and GeoJSON conversion
 */

import type { CoordinatePoint } from './coordinate-validation'

export interface BoundingBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface GeoJSONPolygon {
  type: 'Feature'
  properties: Record<string, any>
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

/**
 * Calculate bounding box for a set of coordinates
 * Used for fast overlap pre-filtering
 */
export function calculateBoundingBox(
  coordinates: CoordinatePoint[]
): BoundingBox {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box for empty coordinates')
  }

  let minLat = coordinates[0].lat
  let maxLat = coordinates[0].lat
  let minLng = coordinates[0].lng
  let maxLng = coordinates[0].lng

  for (const point of coordinates) {
    if (point.lat < minLat) minLat = point.lat
    if (point.lat > maxLat) maxLat = point.lat
    if (point.lng < minLng) minLng = point.lng
    if (point.lng > maxLng) maxLng = point.lng
  }

  return { minLat, maxLat, minLng, maxLng }
}

/**
 * Check if two bounding boxes overlap
 * Fast pre-check before doing expensive polygon intersection
 */
export function doBoundingBoxesOverlap(
  box1: BoundingBox,
  box2: BoundingBox
): boolean {
  return !(
    box1.maxLat < box2.minLat ||
    box1.minLat > box2.maxLat ||
    box1.maxLng < box2.minLng ||
    box1.minLng > box2.maxLng
  )
}

/**
 * Convert coordinates array to GeoJSON Polygon
 * GeoJSON format: [[[lng, lat], [lng, lat], ...]]
 * Note: GeoJSON uses [longitude, latitude] order (opposite of our internal format)
 */
export function coordinatesToGeoJSON(
  coordinates: CoordinatePoint[],
  properties: Record<string, any> = {}
): GeoJSONPolygon {
  // Ensure polygon is closed (first point === last point)
  const coords = [...coordinates]
  const firstPoint = coords[0]
  const lastPoint = coords[coords.length - 1]

  if (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng) {
    coords.push({ ...firstPoint })
  }

  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'Polygon',
      coordinates: [coords.map((point) => [point.lng, point.lat])],
    },
  }
}

/**
 * Convert GeoJSON Polygon to coordinates array
 */
export function geoJSONToCoordinates(
  geoJSON: GeoJSONPolygon
): CoordinatePoint[] {
  const coords = geoJSON.geometry.coordinates[0]

  // Remove the closing point if it exists
  const points = coords.map((coord) => ({
    lat: coord[1],
    lng: coord[0],
  }))

  // Check if last point is the same as first point (polygon closure)
  if (points.length > 1) {
    const first = points[0]
    const last = points[points.length - 1]

    if (first.lat === last.lat && first.lng === last.lng) {
      points.pop()
    }
  }

  return points
}

/**
 * Calculate polygon area using Shoelace formula
 * Returns area in square degrees (for relative comparisons)
 * For actual area in m², use Turf.js area() function
 */
export function calculatePolygonArea(coordinates: CoordinatePoint[]): number {
  if (coordinates.length < 3) return 0

  let area = 0

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length
    area += coordinates[i].lng * coordinates[j].lat
    area -= coordinates[j].lng * coordinates[i].lat
  }

  return Math.abs(area) / 2
}

/**
 * Calculate polygon centroid (center point)
 */
export function calculatePolygonCentroid(
  coordinates: CoordinatePoint[]
): CoordinatePoint {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid for empty coordinates')
  }

  let latSum = 0
  let lngSum = 0

  for (const point of coordinates) {
    latSum += point.lat
    lngSum += point.lng
  }

  return {
    lat: latSum / coordinates.length,
    lng: lngSum / coordinates.length,
  }
}

/**
 * Check if a point is inside a polygon
 * Uses ray casting algorithm
 */
export function isPointInPolygon(
  point: CoordinatePoint,
  polygon: CoordinatePoint[]
): boolean {
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
 * Format coordinates for display (6 decimal places)
 */
export function formatCoordinate(value: number): string {
  return value.toFixed(6)
}

/**
 * Format coordinates array for display
 */
export function formatCoordinatesForDisplay(
  coordinates: CoordinatePoint[]
): string {
  return coordinates
    .map((point, index) => {
      return `Point ${index + 1}: ${formatCoordinate(point.lat)}, ${formatCoordinate(point.lng)}`
    })
    .join('\n')
}

/**
 * Get polygon perimeter (sum of edge lengths)
 * Simple calculation using Euclidean distance
 * For accurate calculations, use Turf.js length() function
 */
export function calculatePolygonPerimeter(
  coordinates: CoordinatePoint[]
): number {
  if (coordinates.length < 2) return 0

  let perimeter = 0

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length
    const dx = coordinates[j].lng - coordinates[i].lng
    const dy = coordinates[j].lat - coordinates[i].lat
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }

  return perimeter
}

/**
 * Validate that polygon has minimum required area
 * Prevents submission of extremely small polygons
 */
export function hasMinimumArea(
  coordinates: CoordinatePoint[],
  minAreaInSqDegrees: number = 0.00001
): boolean {
  const area = calculatePolygonArea(coordinates)
  return area >= minAreaInSqDegrees
}

/**
 * Sort coordinates in clockwise or counter-clockwise order
 * Useful for ensuring consistent polygon orientation
 */
export function sortCoordinatesClockwise(
  coordinates: CoordinatePoint[]
): CoordinatePoint[] {
  const centroid = calculatePolygonCentroid(coordinates)

  const sorted = [...coordinates].sort((a, b) => {
    const angleA = Math.atan2(a.lat - centroid.lat, a.lng - centroid.lng)
    const angleB = Math.atan2(b.lat - centroid.lat, b.lng - centroid.lng)
    return angleA - angleB
  })

  return sorted
}
