"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { CoordinatePointManager } from "./coordinate-point-manager"
import { MapSkeleton } from "@/components/map/map-skeleton"
import {
  normalizeCoordinates,
  validatePolygonGeometry,
  type CoordinatePoint
} from "@/lib/geo/coordinate-validation"

// Dynamically import the map component (client-only, no SSR)
const CoordinateMap = dynamic(
  () => import('@/components/map/coordinate-map').then((mod) => ({ default: mod.CoordinateMap })),
  {
    ssr: false,
    loading: () => <MapSkeleton />
  }
)

interface StepProjectCoordinatesProps {
  data: any
  onUpdate: (data: any) => void
  applicationStatus?: string
  coordinateReviewRemarks?: string
  isReadOnly?: boolean
}

export function StepProjectCoordinates({
  data,
  onUpdate,
  applicationStatus,
  coordinateReviewRemarks,
  isReadOnly = false
}: StepProjectCoordinatesProps) {
  // Initialize coordinates from data (support both old and new formats)
  const [coordinates, setCoordinates] = useState<CoordinatePoint[]>(() => {
    const normalized = normalizeCoordinates(data.projectCoordinates)

    // If no coordinates, initialize with 4 empty points (minimum 3, start with 4 for familiarity)
    if (!normalized || normalized.length === 0) {
      return [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
      ]
    }

    return normalized
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Update parent when coordinates change
  useEffect(() => {
    if (isReadOnly) return

    // Validate coordinates
    const validation = validatePolygonGeometry(coordinates)
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message))
    } else {
      setValidationErrors([])
    }

    // Update parent with new format
    onUpdate({
      projectCoordinates: coordinates
    })
  }, [coordinates, isReadOnly, onUpdate])

  const handleCoordinatesChange = (newCoordinates: CoordinatePoint[]) => {
    setCoordinates(newCoordinates)
  }

  // Status display helpers
  const isPendingApproval = applicationStatus === "PENDING_COORDINATE_APPROVAL"
  const isRejected = applicationStatus === "COORDINATE_REVISION_REQUIRED"
  const isApproved = applicationStatus === "DRAFT" && data.coordinateApprovedAt

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Coordinates</h3>
        <p className="text-sm text-gray-600">
          Define your project area by entering at least 3 boundary coordinate points. These coordinates will be reviewed by the admin to ensure there is no overlap with existing projects.
        </p>
      </div>

      {/* Status Alerts */}
      {isPendingApproval && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-700" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Coordinates Submitted for Review</strong>
            <br />
            Your project coordinates are being reviewed by the admin. You will be notified once they are approved or if revisions are needed. The admin has 14 working days to complete the review.
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>Coordinates Rejected - Revision Required</strong>
            <br />
            {coordinateReviewRemarks && (
              <span className="block mt-1">
                <strong>Remarks:</strong> {coordinateReviewRemarks}
              </span>
            )}
            <span className="block mt-1">
              Please update your coordinates based on the feedback above and resubmit. You have 14 working days to make the required changes.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800 text-sm">
            <strong>Coordinates Approved</strong>
            <br />
            Your project coordinates have been verified. You can now proceed with the rest of your application.
          </AlertDescription>
        </Alert>
      )}

      {/* Important Notice */}
      {!isPendingApproval && !isApproved && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>Important:</strong> You must submit your project coordinates for admin approval before you can proceed with the rest of your application. The admin will verify that your project area does not overlap with existing approved projects.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && !isPendingApproval && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>Validation Errors:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Map Visualization */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Map Visualization</h4>
        <CoordinateMap
          coordinates={coordinates}
          onCoordinatesChange={handleCoordinatesChange}
          isReadOnly={isReadOnly || isPendingApproval}
          showMarkers={true}
          hasErrors={validationErrors.length > 0}
        />
      </div>

      {/* Coordinate Point Manager */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Coordinate Points</h4>
        <CoordinatePointManager
          coordinates={coordinates}
          onChange={handleCoordinatesChange}
          isReadOnly={isReadOnly || isPendingApproval}
          minPoints={3}
          maxPoints={100}
        />
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Enter coordinates in decimal degrees format (e.g., Latitude: 14.5995, Longitude: 120.9842)</p>
        <p>• Drag markers on the map to adjust coordinates visually</p>
        <p>• At least 3 points are required to form a valid polygon</p>
        <p>• Points should define the boundary of your project area in order</p>
        <p>• Coordinates will be validated for overlaps with existing approved projects</p>
      </div>
    </div>
  )
}
