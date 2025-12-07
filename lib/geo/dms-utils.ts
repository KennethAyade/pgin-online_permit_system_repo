/**
 * DMS (Degrees-Minutes-Seconds) Coordinate Utilities
 * Handles parsing, validation, and conversion between DMS and decimal formats
 */

// Regex pattern for DMS format: DD°MM'SS.SS"
// Examples: 18°08'53.19" or 120°39'48.90"
export const DMS_PATTERN = /^(\d{1,3})°(\d{1,2})'([\d.]+)"$/

/**
 * Validate DMS format string
 * @param dmsString - String in DMS format (e.g., "18°08'53.19"")
 * @returns true if format is valid
 */
export function validateDMSFormat(dmsString: string): boolean {
  if (!dmsString || typeof dmsString !== 'string') {
    return false
  }

  const match = dmsString.trim().match(DMS_PATTERN)
  if (!match) {
    return false
  }

  const degrees = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const seconds = parseFloat(match[3])

  // Validate ranges
  if (degrees < 0 || degrees > 180) return false
  if (minutes < 0 || minutes > 59) return false
  if (seconds < 0 || seconds >= 60) return false

  return true
}

/**
 * Parse DMS string to decimal degrees (supports multiple formats)
 * @param dmsString - String in various DMS formats
 * @returns Decimal degrees or null if invalid
 * 
 * Supported formats:
 * - Standard: 18°08'53.19"
 * - Alternative: 18d08m53.19s
 * - Space-separated: 18 08 53.19
 * - Mixed: 18° 08' 53.19"
 */
export function parseDMS(dmsString: string): number | null {
  if (!dmsString || typeof dmsString !== 'string') {
    return null
  }

  const trimmed = dmsString.trim()
  
  // Try multiple patterns in order of specificity
  const patterns = [
    // Standard: 18°08'53.19"
    /^(\d{1,3})[°]\s*(\d{1,2})['′]\s*([\d.]+)[\"″]$/,
    // Alternative with d/m/s: 18d08m53.19s
    /^(\d{1,3})d\s*(\d{1,2})m\s*([\d.]+)s$/i,
    // Space-separated: 18 08 53.19
    /^(\d{1,3})\s+(\d{1,2})\s+([\d.]+)$/,
    // Degrees and minutes only: 18°08' or 18d08m
    /^(\d{1,3})[°d]\s*(\d{1,2})['′m]$/i,
    // Degrees only: 18° or 18d
    /^(\d{1,3})[°d]$/i,
  ]

  let match = null
  let degrees = 0
  let minutes = 0
  let seconds = 0

  // Try each pattern
  for (const pattern of patterns) {
    match = trimmed.match(pattern)
    if (match) {
      degrees = parseInt(match[1], 10)
      minutes = match[2] ? parseInt(match[2], 10) : 0
      seconds = match[3] ? parseFloat(match[3]) : 0
      break
    }
  }

  // If no pattern matched, try parsing as plain decimal
  if (!match) {
    const decimalValue = parseFloat(trimmed)
    if (!isNaN(decimalValue) && decimalValue >= -180 && decimalValue <= 180) {
      return Math.round(decimalValue * 1000000) / 1000000
    }
    return null
  }

  // Validate ranges
  if (degrees < 0 || degrees > 180) return null
  if (minutes < 0 || minutes > 59) return null
  if (seconds < 0 || seconds >= 60) return null

  // Convert to decimal degrees
  const decimal = degrees + (minutes / 60) + (seconds / 3600)

  // Round to 6 decimal places (approximately 0.1 meter precision)
  return Math.round(decimal * 1000000) / 1000000
}

/**
 * Convert decimal degrees to DMS format
 * @param decimal - Decimal degrees
 * @param isLatitude - Whether this is latitude (affects validation range)
 * @returns DMS formatted string (e.g., "18°08'53.19"")
 */
export function decimalToDMS(decimal: number, isLatitude: boolean = false): string {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return '0°00\'00.00"'
  }

  // Validate ranges
  const maxDegrees = isLatitude ? 90 : 180
  if (Math.abs(decimal) > maxDegrees) {
    return '0°00\'00.00"'
  }

  // Take absolute value (handle negative coordinates separately if needed)
  const absoluteDecimal = Math.abs(decimal)

  // Extract degrees
  let degrees = Math.floor(absoluteDecimal)

  // Extract minutes
  let minutesDecimal = (absoluteDecimal - degrees) * 60
  let minutes = Math.floor(minutesDecimal)

  // Extract seconds
  let seconds = (minutesDecimal - minutes) * 60

  // Round seconds to 2 decimal places to avoid floating point precision issues
  seconds = Math.round(seconds * 100) / 100

  // Handle rollover: if seconds >= 60, add to minutes
  if (seconds >= 60) {
    seconds = 0
    minutes += 1
  }

  // Handle rollover: if minutes >= 60, add to degrees
  if (minutes >= 60) {
    minutes = 0
    degrees += 1
  }

  // Format with 2 decimal places for seconds
  const secondsFormatted = seconds.toFixed(2)

  // Pad with zeros
  const degreesStr = degrees.toString()
  const minutesStr = minutes.toString().padStart(2, '0')

  return `${degreesStr}°${minutesStr}'${secondsFormatted}"`
}

/**
 * Validate DMS coordinate with specific lat/lng rules
 * @param dmsString - DMS string to validate
 * @param isLatitude - Whether this is latitude
 * @returns Validation result with error message if invalid
 */
export function validateDMSCoordinate(
  dmsString: string,
  isLatitude: boolean
): { isValid: boolean; error?: string } {
  if (!dmsString || typeof dmsString !== 'string') {
    return {
      isValid: false,
      error: 'Coordinate is required',
    }
  }

  const trimmed = dmsString.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Coordinate is required',
    }
  }

  // Check format
  if (!validateDMSFormat(trimmed)) {
    return {
      isValid: false,
      error: `Invalid DMS format. Expected format: DD°MM'SS.SS" (e.g., ${
        isLatitude ? '18°08\'53.19"' : '120°39\'48.90"'
      })`,
    }
  }

  // Parse and validate value
  const decimal = parseDMS(trimmed)
  if (decimal === null) {
    return {
      isValid: false,
      error: 'Invalid coordinate value',
    }
  }

  // Validate range
  const maxDegrees = isLatitude ? 90 : 180
  if (Math.abs(decimal) > maxDegrees) {
    return {
      isValid: false,
      error: `${isLatitude ? 'Latitude' : 'Longitude'} must be between 0° and ${maxDegrees}°`,
    }
  }

  return { isValid: true }
}

/**
 * Helper to check if a string looks like DMS format (for UI hints)
 * @param value - String to check
 * @returns true if it contains DMS symbols
 */
export function lookLikeDMS(value: string): boolean {
  return /[°'""]/.test(value)
}

/**
 * Normalize/format DMS string to standard format
 * Accepts various inputs and converts to: DD°MM'SS.SS"
 * @param dmsString - String in any DMS format
 * @param isLatitude - Whether this is latitude (for validation)
 * @returns Standardized DMS string or null if invalid
 */
export function normalizeDMS(dmsString: string, isLatitude: boolean = false): string | null {
  // First parse the input
  const decimal = parseDMS(dmsString)
  if (decimal === null) {
    return null
  }

  // Convert back to standard DMS format
  return decimalToDMS(decimal, isLatitude)
}


