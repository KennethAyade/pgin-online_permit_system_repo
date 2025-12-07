"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, CheckCircle, XCircle, AlertTriangle, Upload, FileText } from "lucide-react"
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
  applicationId?: string
  data: any
  onUpdate: (data: any) => void
  applicationStatus?: string
  coordinateReviewRemarks?: string
  overlappingProjects?: any[]
  consentLetterUrl?: string
  isReadOnly?: boolean
}

export function StepProjectCoordinates({
  applicationId,
  data,
  onUpdate,
  applicationStatus,
  coordinateReviewRemarks,
  overlappingProjects = [],
  consentLetterUrl,
  isReadOnly = false
}: StepProjectCoordinatesProps) {
  const [consentFile, setConsentFile] = useState<File | null>(null)
  const [isUploadingConsent, setIsUploadingConsent] = useState(false)
  const [consentUploadError, setConsentUploadError] = useState<string>("")

  // Track last validated coordinates to prevent unnecessary parent updates
  const [lastValidatedCoords, setLastValidatedCoords] = useState<CoordinatePoint[]>([])

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

    // Check if coordinates actually changed (deep comparison)
    // This prevents unnecessary re-renders while user is typing
    const coordsChanged = JSON.stringify(coordinates) !== JSON.stringify(lastValidatedCoords)
    if (!coordsChanged) return

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

    // Remember last validated coordinates
    setLastValidatedCoords(coordinates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, isReadOnly])

  const handleCoordinatesChange = (newCoordinates: CoordinatePoint[]) => {
    setCoordinates(newCoordinates)
  }

  const handleConsentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        setConsentUploadError("Please upload a PDF file")
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setConsentUploadError("File size must be less than 10MB")
        return
      }
      setConsentFile(file)
      setConsentUploadError("")
    }
  }

  const handleConsentUpload = async () => {
    if (!consentFile) return

    setIsUploadingConsent(true)
    setConsentUploadError("")

    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", consentFile)
      formData.append("applicationId", applicationId || data.id || "")
      formData.append("documentType", "CONSENT_LETTER")
      formData.append("documentName", "Consent Letter for Overlapping Coordinates")

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to upload consent letter")
      }

      const result = await response.json()

      // Update application with consent letter URL
      onUpdate({
        ...data,
        consentLetterUrl: result.document.fileUrl,
        consentLetterFilename: result.document.fileName,
      })

      alert("Consent letter uploaded successfully")
    } catch (error) {
      console.error("Error uploading consent letter:", error)
      setConsentUploadError(error instanceof Error ? error.message : "Failed to upload consent letter. Please try again.")
    } finally {
      setIsUploadingConsent(false)
    }
  }

  // Status display helpers
  const isPendingApproval = applicationStatus === "PENDING_COORDINATE_APPROVAL" // Deprecated but keep for backward compatibility
  const isAutoApproved = applicationStatus === "COORDINATE_AUTO_APPROVED"
  const isOverlapDetected = applicationStatus === "OVERLAP_DETECTED_PENDING_CONSENT"
  const isRejected = applicationStatus === "COORDINATE_REVISION_REQUIRED"
  const isApproved = isAutoApproved || (applicationStatus === "DRAFT" && data.coordinateApprovedAt)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Coordinates</h3>
        <p className="text-sm text-gray-600">
          Define your project area by entering at least 3 boundary coordinate points. Coordinates will be automatically checked for overlap with existing projects and instantly approved if no overlap is detected.
        </p>
      </div>

      {/* Status Alerts */}
      {isAutoApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800 text-sm">
            <strong>Coordinates Auto-Approved</strong>
            <br />
            Your project coordinates have been automatically verified with no overlap detected. You can now proceed with the rest of your application.
          </AlertDescription>
        </Alert>
      )}

      {isOverlapDetected && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-700" />
          <AlertDescription className="text-orange-800 text-sm">
            <strong>Overlap Detected - Consent Letter Required</strong>
            <br />
            <span className="block mt-2">
              Your project area overlaps with the following existing permit(s):
            </span>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {overlappingProjects.map((project: any, index: number) => (
                <li key={index}>
                  {project.projectName || "Unnamed Project"} ({project.applicationNo}) - {project.permitType}
                </li>
              ))}
            </ul>
            <span className="block mt-2">
              Please upload a consent letter from the permit holder(s) to proceed.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Consent Letter Upload */}
      {isOverlapDetected && !isReadOnly && (
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Consent Letter</h4>
            <p className="text-xs text-gray-600 mb-3">
              Upload a consent letter from the existing permit holder(s) authorizing the overlap.
            </p>
          </div>

          {consentLetterUrl ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <FileText className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Consent Letter Uploaded</p>
                <p className="text-xs text-green-700">Awaiting admin review</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="consent-letter" className="text-sm">
                  Consent Letter (PDF only, max 10MB)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="consent-letter"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleConsentFileChange}
                    disabled={isUploadingConsent}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleConsentUpload}
                    disabled={!consentFile || isUploadingConsent}
                    className="whitespace-nowrap"
                  >
                    {isUploadingConsent ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {consentFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {consentFile.name}
                  </p>
                )}
              </div>

              {consentUploadError && (
                <p className="text-sm text-red-600">{consentUploadError}</p>
              )}
            </div>
          )}
        </div>
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
      {!isAutoApproved && !isOverlapDetected && !isRejected && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-700" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Important:</strong> Your project coordinates will be automatically checked for overlap with existing projects. If no overlap is detected, they will be auto-approved instantly. If overlap is found, you'll need to upload a consent letter from the existing permit holder(s).
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
        <p>• Enter coordinates in DMS format (Degrees-Minutes-Seconds)</p>
        <p>• Example - Latitude: 18°08'53.19", Longitude: 120°39'48.90"</p>
        <p>• Format: DD°MM'SS.SS" where DD=degrees, MM=minutes, SS=seconds</p>
        <p>• Drag markers on the map to adjust coordinates visually</p>
        <p>• At least 3 points are required to form a valid polygon</p>
        <p>• Points should define the boundary of your project area in order</p>
        <p>• Coordinates will be validated for overlaps with existing approved projects</p>
      </div>
    </div>
  )
}
