/**
 * Coordinate History Service
 * Phase 2.3: Manage approved coordinate records
 */

import { prisma } from '@/lib/db'
import type { CoordinatePoint } from '@/lib/geo/coordinate-validation'
import {
  calculateBoundingBox,
  coordinatesToGeoJSON,
} from '@/lib/geo/polygon-helpers'
import type { CoordinateData } from '@/lib/geo/overlap-detection'

/**
 * Create a coordinate history record when admin approves coordinates
 */
export async function createCoordinateHistory(
  applicationId: string,
  coordinates: CoordinatePoint[],
  approvedBy: string
) {
  // Calculate bounding box for fast overlap queries
  const bounds = calculateBoundingBox(coordinates)

  // Convert to GeoJSON for storage
  const polygonGeoJSON = coordinatesToGeoJSON(coordinates)

  // Create the coordinate history record
  const coordinateHistory = await prisma.coordinateHistory.create({
    data: {
      applicationId,
      coordinates: coordinates as any, // Store as JSON array
      pointCount: coordinates.length,
      polygonGeoJSON: polygonGeoJSON as any,
      bounds: bounds as any,
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy,
    },
  })

  return coordinateHistory
}

/**
 * Get all active (approved) coordinates for overlap checking
 */
export async function getActiveCoordinates(
  excludeApplicationId?: string
): Promise<CoordinateData[]> {
  const coordinateHistories = await prisma.coordinateHistory.findMany({
    where: {
      status: 'ACTIVE',
      ...(excludeApplicationId && {
        applicationId: {
          not: excludeApplicationId,
        },
      }),
    },
    include: {
      application: {
        select: {
          applicationNo: true,
        },
      },
    },
  })

  // Transform to CoordinateData format
  return coordinateHistories.map((history) => ({
    applicationId: history.applicationId,
    applicationNo: history.application.applicationNo,
    coordinates: history.coordinates as unknown as CoordinatePoint[],
    bounds: history.bounds as any,
  }))
}

/**
 * Get coordinate history for a specific application
 */
export async function getCoordinateHistoryByApplicationId(
  applicationId: string
) {
  return await prisma.coordinateHistory.findFirst({
    where: {
      applicationId,
      status: 'ACTIVE',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Replace existing coordinates with new ones (when revised and re-approved)
 */
export async function replaceCoordinates(
  applicationId: string,
  newCoordinates: CoordinatePoint[],
  approvedBy: string
) {
  // Mark old coordinates as REPLACED
  const oldHistory = await prisma.coordinateHistory.findFirst({
    where: {
      applicationId,
      status: 'ACTIVE',
    },
  })

  if (oldHistory) {
    await prisma.coordinateHistory.update({
      where: { id: oldHistory.id },
      data: {
        status: 'REPLACED',
        replacedAt: new Date(),
      },
    })
  }

  // Create new coordinate history
  const newHistory = await createCoordinateHistory(
    applicationId,
    newCoordinates,
    approvedBy
  )

  // Update the old record to reference the new one
  if (oldHistory) {
    await prisma.coordinateHistory.update({
      where: { id: oldHistory.id },
      data: {
        replacedBy: newHistory.id,
      },
    })
  }

  return newHistory
}

/**
 * Void coordinates when application is voided
 */
export async function voidCoordinates(applicationId: string) {
  await prisma.coordinateHistory.updateMany({
    where: {
      applicationId,
      status: 'ACTIVE',
    },
    data: {
      status: 'VOIDED',
    },
  })
}

/**
 * Get coordinate history with full details
 */
export async function getCoordinateHistoryWithDetails(
  coordinateHistoryId: string
) {
  return await prisma.coordinateHistory.findUnique({
    where: { id: coordinateHistoryId },
    include: {
      application: {
        select: {
          applicationNo: true,
          projectName: true,
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
      overlapConsents: true,
      consentRequests: true,
    },
  })
}

/**
 * Get all coordinate revisions for an application (history trail)
 */
export async function getCoordinateRevisionHistory(applicationId: string) {
  return await prisma.coordinateHistory.findMany({
    where: { applicationId },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Check if application has approved coordinates
 */
export async function hasApprovedCoordinates(
  applicationId: string
): Promise<boolean> {
  const count = await prisma.coordinateHistory.count({
    where: {
      applicationId,
      status: 'ACTIVE',
    },
  })

  return count > 0
}

/**
 * Get statistics about coordinate history
 */
export async function getCoordinateStatistics() {
  const [totalActive, totalReplaced, totalVoided, avgPointCount] =
    await Promise.all([
      prisma.coordinateHistory.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.coordinateHistory.count({
        where: { status: 'REPLACED' },
      }),
      prisma.coordinateHistory.count({
        where: { status: 'VOIDED' },
      }),
      prisma.coordinateHistory.aggregate({
        where: { status: 'ACTIVE' },
        _avg: {
          pointCount: true,
        },
      }),
    ])

  return {
    totalActive,
    totalReplaced,
    totalVoided,
    avgPointCount: Math.round(avgPointCount._avg.pointCount || 0),
  }
}
