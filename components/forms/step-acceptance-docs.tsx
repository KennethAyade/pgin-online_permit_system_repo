"use client"

import { useState, useEffect } from "react"
import { DocumentUpload } from "@/components/application/document-upload"
import { DOCUMENT_REQUIREMENTS } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, FileText, MapPin, CheckCircle2 } from "lucide-react"

interface StepAcceptanceDocsProps {
  applicationId?: string
  permitType: "ISAG" | "CSAG"
  data: any
  onUpdate: (data: any) => void
}

interface CoordinatePoint {
  latitude: string
  longitude: string
}

const DOCUMENT_LABELS: Record<string, string> = {
  APPLICATION_FORM: "Duly accomplished Application Form (MGB Form 8-4)",
  SURVEY_PLAN: "Survey Plan (signed & sealed by deputized Geodetic Engineer)",
  LOCATION_MAP: "Location Map (NAMRIA Topographic Map 1:50,000)",
  WORK_PROGRAM: "Work Program (MGB Form 6-2)",
  IEE_REPORT: "Initial Environmental Examination (IEE) Report",
  EPEP: "Certificate of Environmental Management and Community Relations Record - ISAG only",
  PROOF_TECHNICAL_COMPETENCE: "Proof of Technical Competence (CVs, Licenses, Track Records)",
  PROOF_FINANCIAL_CAPABILITY: "Proof of Financial Capability (Statement of Assets & Liabilities, FS, ITR, etc.)",
  ARTICLES_INCORPORATION: "Articles of Incorporation / Partnership (SEC Certified, if applicable)",
  OTHER_SUPPORTING_PAPERS: "Other supporting papers required by MGB / PMRB",
}

export function StepAcceptanceDocs({
  applicationId,
  permitType,
  data,
  onUpdate,
}: StepAcceptanceDocsProps) {
  const [documents, setDocuments] = useState<any[]>([])

  // Initialize coordinates from data or empty
  const [coordinates, setCoordinates] = useState<{
    point1: CoordinatePoint
    point2: CoordinatePoint
    point3: CoordinatePoint
    point4: CoordinatePoint
  }>({
    point1: data?.projectCoordinates?.point1 || { latitude: "", longitude: "" },
    point2: data?.projectCoordinates?.point2 || { latitude: "", longitude: "" },
    point3: data?.projectCoordinates?.point3 || { latitude: "", longitude: "" },
    point4: data?.projectCoordinates?.point4 || { latitude: "", longitude: "" },
  })

  useEffect(() => {
    if (applicationId) {
      fetchDocuments()
    }
  }, [applicationId])

  // Load coordinates from data when it changes
  useEffect(() => {
    if (data?.projectCoordinates) {
      setCoordinates({
        point1: data.projectCoordinates.point1 || { latitude: "", longitude: "" },
        point2: data.projectCoordinates.point2 || { latitude: "", longitude: "" },
        point3: data.projectCoordinates.point3 || { latitude: "", longitude: "" },
        point4: data.projectCoordinates.point4 || { latitude: "", longitude: "" },
      })
    }
  }, [data?.projectCoordinates])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      const result = await response.json()
      if (result.application) {
        setDocuments(result.application.documents || [])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const updateCoordinate = (point: string, field: string, value: string) => {
    const newCoordinates = {
      ...coordinates,
      [point]: {
        ...coordinates[point as keyof typeof coordinates],
        [field]: value
      }
    }
    setCoordinates(newCoordinates)

    // Notify parent of the change
    onUpdate({
      ...data,
      projectCoordinates: newCoordinates
    })
  }

  // Check if all coordinates are filled
  const areCoordinatesComplete = () => {
    const points = [coordinates.point1, coordinates.point2, coordinates.point3, coordinates.point4]
    return points.every(p => p.latitude.trim() !== "" && p.longitude.trim() !== "")
  }

  const requirements = permitType === "ISAG"
    ? DOCUMENT_REQUIREMENTS.ISAG.acceptance
    : DOCUMENT_REQUIREMENTS.CSAG.acceptance

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Acceptance Requirements</h3>
        <p className="text-sm text-gray-600">
          Upload all required documents. Each document must be in PDF format, maximum 10MB.
        </p>
      </div>

      {!applicationId ? (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            Please complete the previous steps first to create an application.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-700" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Document Requirements:</strong> All documents must be clear, legible, and properly signed/sealed where required.
            </AlertDescription>
          </Alert>

          {/* Project Coordinates - First Requirement */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mt-1">
                <MapPin className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500">#1</span>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Project Coordinates
                  </h4>
                  {areCoordinatesComplete() && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Enter the 4 corner coordinates of your project area boundary
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Point 1 */}
              <div className="border rounded-lg p-3 bg-white">
                <Label className="text-xs font-medium text-gray-700 mb-2 block">Point 1</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="p1-lat" className="text-xs text-gray-500">Latitude</Label>
                    <Input
                      id="p1-lat"
                      placeholder="e.g., 14.5995"
                      value={coordinates.point1.latitude}
                      onChange={(e) => updateCoordinate("point1", "latitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p1-lng" className="text-xs text-gray-500">Longitude</Label>
                    <Input
                      id="p1-lng"
                      placeholder="e.g., 120.9842"
                      value={coordinates.point1.longitude}
                      onChange={(e) => updateCoordinate("point1", "longitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Point 2 */}
              <div className="border rounded-lg p-3 bg-white">
                <Label className="text-xs font-medium text-gray-700 mb-2 block">Point 2</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="p2-lat" className="text-xs text-gray-500">Latitude</Label>
                    <Input
                      id="p2-lat"
                      placeholder="e.g., 14.5995"
                      value={coordinates.point2.latitude}
                      onChange={(e) => updateCoordinate("point2", "latitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p2-lng" className="text-xs text-gray-500">Longitude</Label>
                    <Input
                      id="p2-lng"
                      placeholder="e.g., 120.9842"
                      value={coordinates.point2.longitude}
                      onChange={(e) => updateCoordinate("point2", "longitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Point 3 */}
              <div className="border rounded-lg p-3 bg-white">
                <Label className="text-xs font-medium text-gray-700 mb-2 block">Point 3</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="p3-lat" className="text-xs text-gray-500">Latitude</Label>
                    <Input
                      id="p3-lat"
                      placeholder="e.g., 14.5995"
                      value={coordinates.point3.latitude}
                      onChange={(e) => updateCoordinate("point3", "latitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p3-lng" className="text-xs text-gray-500">Longitude</Label>
                    <Input
                      id="p3-lng"
                      placeholder="e.g., 120.9842"
                      value={coordinates.point3.longitude}
                      onChange={(e) => updateCoordinate("point3", "longitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Point 4 */}
              <div className="border rounded-lg p-3 bg-white">
                <Label className="text-xs font-medium text-gray-700 mb-2 block">Point 4</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="p4-lat" className="text-xs text-gray-500">Latitude</Label>
                    <Input
                      id="p4-lat"
                      placeholder="e.g., 14.5995"
                      value={coordinates.point4.latitude}
                      onChange={(e) => updateCoordinate("point4", "latitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p4-lng" className="text-xs text-gray-500">Longitude</Label>
                    <Input
                      id="p4-lng"
                      placeholder="e.g., 120.9842"
                      value={coordinates.point4.longitude}
                      onChange={(e) => updateCoordinate("point4", "longitude", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Requirements Notice */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-700" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>Next Steps:</strong> After you submit this application, you will need to wait for the admin to verify your project coordinates. Once approved, you can proceed to upload the remaining {requirements.length} document requirements through the Acceptance Requirements section.
            </AlertDescription>
          </Alert>

          {/* Document Requirements Preview (Read-only) */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Upcoming Document Requirements</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-600">
                {requirements.map((docType, index) => (
                  <li key={docType} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">#{index + 2}</span>
                    <FileText className="h-3 w-3 text-gray-400" />
                    <span>{DOCUMENT_LABELS[docType] || docType}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">
                These documents will be available for upload after your coordinates are approved.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
