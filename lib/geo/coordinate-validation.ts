/**
 * Coordinate Validation Utilities
 * Phase 2.1: Support for unlimited coordinate points (minimum 3)
 */

export interface CoordinatePoint {
  lat: number
  lng: number
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Philippines approximate bounds for warnings
const PHILIPPINES_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.3,
  minLng: 116.0,
  maxLng: 127.0,
}

// Valid coordinate ranges
const VALID_RANGES = {
  minLat: -90,
  maxLat: 90,
  minLng: -180,
  maxLng: 180,
}

/**
 * Validate a single coordinate point
 */
export function validateCoordinatePoint(
  point: CoordinatePoint,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = []

  // Check if lat/lng exist
  if (point.lat === undefined || point.lat === null) {
    errors.push({
      field: `point${index + 1}.lat`,
      message: 'Latitude is required',
    })
  }

  if (point.lng === undefined || point.lng === null) {
    errors.push({
      field: `point${index + 1}.lng`,
      message: 'Longitude is required',
    })
  }

  // Check if valid numbers
  if (typeof point.lat !== 'number' || isNaN(point.lat)) {
    errors.push({
      field: `point${index + 1}.lat`,
      message: 'Latitude must be a valid number',
    })
  }

  if (typeof point.lng !== 'number' || isNaN(point.lng)) {
    errors.push({
      field: `point${index + 1}.lng`,
      message: 'Longitude must be a valid number',
    })
  }

  // Check valid ranges
  if (point.lat < VALID_RANGES.minLat || point.lat > VALID_RANGES.maxLat) {
    errors.push({
      field: `point${index + 1}.lat`,
      message: `Latitude must be between ${VALID_RANGES.minLat} and ${VALID_RANGES.maxLat}`,
    })
  }

  if (point.lng < VALID_RANGES.minLng || point.lng > VALID_RANGES.maxLng) {
    errors.push({
      field: `point${index + 1}.lng`,
      message: `Longitude must be between ${VALID_RANGES.minLng} and ${VALID_RANGES.maxLng}`,
    })
  }

  return errors
}

/**
 * Check if coordinates are within Philippines bounds (warning only)
 */
export function isWithinPhilippinesBounds(point: CoordinatePoint): boolean {
  return (
    point.lat >= PHILIPPINES_BOUNDS.minLat &&
    point.lat <= PHILIPPINES_BOUNDS.maxLat &&
    point.lng >= PHILIPPINES_BOUNDS.minLng &&
    point.lng <= PHILIPPINES_BOUNDS.maxLng
  )
}

/**
 * Validate an array of coordinate points
 */
export function validateCoordinates(
  coordinates: CoordinatePoint[]
): ValidationResult {
  const errors: ValidationError[] = []

  // Check minimum points
  if (!coordinates || coordinates.length < 3) {
    errors.push({
      field: 'coordinates',
      message: 'At least 3 coordinate points are required to form a polygon',
    })
    return { isValid: false, errors }
  }

  // Validate each point
  coordinates.forEach((point, index) => {
    const pointErrors = validateCoordinatePoint(point, index)
    errors.push(...pointErrors)
  })

  // Check for duplicate points
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      if (
        coordinates[i].lat === coordinates[j].lat &&
        coordinates[i].lng === coordinates[j].lng
      ) {
        errors.push({
          field: `point${j + 1}`,
          message: `Point ${j + 1} is a duplicate of Point ${i + 1}`,
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if all points are collinear (lie on the same line)
 * Collinear points cannot form a valid polygon
 */
export function arePointsCollinear(coordinates: CoordinatePoint[]): boolean {
  if (coordinates.length < 3) return true

  // Use cross product to check collinearity
  // If all cross products are zero, points are collinear
  const p1 = coordinates[0]
  const p2 = coordinates[1]

  for (let i = 2; i < coordinates.length; i++) {
    const p3 = coordinates[i]
    const crossProduct =
      (p2.lat - p1.lat) * (p3.lng - p1.lng) -
      (p2.lng - p1.lng) * (p3.lat - p1.lat)

    // If any cross product is non-zero, points are not collinear
    if (Math.abs(crossProduct) > 1e-10) {
      return false
    }
  }

  return true
}

/**
 * Check for self-intersecting polygon
 * Uses line segment intersection detection
 */
export function isPolygonSelfIntersecting(
  coordinates: CoordinatePoint[]
): boolean {
  if (coordinates.length < 4) return false

  // Check each pair of line segments
  for (let i = 0; i < coordinates.length; i++) {
    const p1 = coordinates[i]
    const p2 = coordinates[(i + 1) % coordinates.length]

    for (let j = i + 2; j < coordinates.length; j++) {
      // Skip adjacent segments
      if (j === (i + coordinates.length - 1) % coordinates.length) continue

      const p3 = coordinates[j]
      const p4 = coordinates[(j + 1) % coordinates.length]

      if (doSegmentsIntersect(p1, p2, p3, p4)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if two line segments intersect
 */
function doSegmentsIntersect(
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
 * Comprehensive polygon validation
 */
export function validatePolygonGeometry(
  coordinates: CoordinatePoint[]
): ValidationResult {
  const errors: ValidationError[] = []

  // Basic coordinate validation
  const basicValidation = validateCoordinates(coordinates)
  if (!basicValidation.isValid) {
    return basicValidation
  }

  // Check for collinear points
  if (arePointsCollinear(coordinates)) {
    errors.push({
      field: 'coordinates',
      message: 'Points cannot be collinear - they must form a valid polygon area',
    })
  }

  // Check for self-intersecting polygon
  if (isPolygonSelfIntersecting(coordinates)) {
    errors.push({
      field: 'coordinates',
      message: 'Polygon edges cannot cross each other (self-intersecting polygon)',
    })
  }

  // Warning for points outside Philippines (not an error)
  const outsidePhilippines = coordinates.filter(
    (point) => !isWithinPhilippinesBounds(point)
  )
  if (outsidePhilippines.length > 0) {
    console.warn(
      `Warning: ${outsidePhilippines.length} coordinate(s) are outside Philippines bounds`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Convert old 4-point format to new array format (for backward compatibility)
 */
export function normalizeCoordinates(
  raw: any
): CoordinatePoint[] | null {
  if (!raw) return null

  // New format - already an array
  if (Array.isArray(raw)) {
    return raw.map((point) => ({
      lat: typeof point.lat === 'number' ? point.lat : parseFloat(point.lat),
      lng: typeof point.lng === 'number' ? point.lng : parseFloat(point.lng),
    }))
  }

  // Old format - object with point1, point2, etc.
  if (raw.point1 && raw.point2 && raw.point3) {
    const coordinates: CoordinatePoint[] = []

    for (let i = 1; i <= 10; i++) {
      const pointKey = `point${i}`
      if (raw[pointKey]) {
        const point = raw[pointKey]
        coordinates.push({
          lat:
            typeof point.latitude === 'number'
              ? point.latitude
              : parseFloat(point.latitude || point.lat),
          lng:
            typeof point.longitude === 'number'
              ? point.longitude
              : parseFloat(point.longitude || point.lng),
        })
      }
    }

    return coordinates
  }

  return null
}
