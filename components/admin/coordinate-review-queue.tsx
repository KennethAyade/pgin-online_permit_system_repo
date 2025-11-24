"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  Building,
} from "lucide-react"

interface CoordinateApplication {
  id: string
  applicationNo: string
  permitType: string
  projectName: string
  projectCoordinates: any
  coordinateReviewDeadline: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
    companyName: string | null
  }
}

interface OverlapResult {
  hasOverlap: boolean
  overlappingProjects: Array<{
    applicationNo: string
    projectName: string
  }>
}

export function CoordinateReviewQueue() {
  const [applications, setApplications] = useState<CoordinateApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<CoordinateApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [overlapResult, setOverlapResult] = useState<OverlapResult | null>(null)
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false)

  useEffect(() => {
    fetchPendingCoordinates()
  }, [])

  useEffect(() => {
    if (selectedApp) {
      checkOverlap(selectedApp)
    }
  }, [selectedApp])

  const fetchPendingCoordinates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/coordinates/pending")
      const result = await response.json()
      if (result.applications) {
        setApplications(result.applications)
        if (result.applications.length > 0 && !selectedApp) {
          setSelectedApp(result.applications[0])
        }
      }
    } catch (error) {
      console.error("Error fetching pending coordinates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkOverlap = async (app: CoordinateApplication) => {
    if (!app.projectCoordinates) return

    setIsCheckingOverlap(true)
    setOverlapResult(null)
    try {
      const response = await fetch("/api/admin/acceptanceRequirements/checkOverlap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          coordinates: app.projectCoordinates,
        }),
      })
      const result = await response.json()
      setOverlapResult(result)
    } catch (error) {
      console.error("Error checking overlap:", error)
    } finally {
      setIsCheckingOverlap(false)
    }
  }

  const handleReview = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedApp) return

    if (decision === "REJECTED" && !remarks.trim()) {
      alert("Please provide remarks explaining why the coordinates are rejected")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/coordinates/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          decision,
          remarks: remarks.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Failed to submit review")
        return
      }

      // Refresh the list
      await fetchPendingCoordinates()
      setRemarks("")
      setOverlapResult(null)

      alert(
        decision === "APPROVED"
          ? "Coordinates approved successfully"
          : "Coordinates rejected, applicant notified"
      )
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("An error occurred while submitting the review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <span className="text-red-600 font-medium">Overdue by {Math.abs(diffDays)} days</span>
    } else if (diffDays <= 3) {
      return <span className="text-yellow-600 font-medium">{diffDays} days left</span>
    } else {
      return <span className="text-gray-600">{diffDays} days left</span>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading pending coordinates...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No pending coordinate reviews</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Application List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pending Reviews ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  setSelectedApp(app)
                  setRemarks("")
                }}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedApp?.id === app.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {app.applicationNo}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {app.permitType}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{app.projectName || "Unnamed Project"}</p>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDeadline(app.coordinateReviewDeadline)}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Panel */}
      <Card className="lg:col-span-2">
        {selectedApp ? (
          <>
            <CardHeader>
              <CardTitle className="text-lg">Review Coordinates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Applicant Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Applicant Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{selectedApp.user.fullName}</span>
                  </div>
                  {selectedApp.user.companyName && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>{selectedApp.user.companyName}</span>
                    </div>
                  )}
                  <p className="text-gray-500">{selectedApp.user.email}</p>
                </div>
              </div>

              {/* Coordinates Display */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Project Coordinates</h4>
                {selectedApp.projectCoordinates ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((num) => {
                      const point = selectedApp.projectCoordinates[`point${num}`]
                      return (
                        <div key={num} className="bg-gray-50 rounded-lg p-3">
                          <span className="text-xs font-medium text-gray-500">Point {num}</span>
                          <p className="text-sm mt-1">
                            <span className="text-gray-600">Lat:</span>{" "}
                            <span className="font-mono">{point?.latitude || "N/A"}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">Lng:</span>{" "}
                            <span className="font-mono">{point?.longitude || "N/A"}</span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No coordinates provided</p>
                )}
              </div>

              {/* Overlap Check Results */}
              {isCheckingOverlap ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <RefreshCw className="h-4 w-4 text-blue-700 animate-spin" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Checking for overlaps with existing projects...
                  </AlertDescription>
                </Alert>
              ) : overlapResult ? (
                overlapResult.hasOverlap ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-700" />
                    <AlertDescription className="text-red-800 text-sm">
                      <strong>Overlap Detected!</strong>
                      <br />
                      These coordinates overlap with:
                      <ul className="list-disc list-inside mt-1">
                        {overlapResult.overlappingProjects.map((proj, idx) => (
                          <li key={idx}>
                            {proj.applicationNo} - {proj.projectName}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <AlertDescription className="text-green-800 text-sm">
                      <strong>No Overlap Found</strong>
                      <br />
                      These coordinates do not overlap with any existing approved projects.
                    </AlertDescription>
                  </Alert>
                )
              ) : null}

              {/* Remarks */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Review Remarks
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks (required for rejection)..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleReview("APPROVED")}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Coordinates
                </Button>
                <Button
                  onClick={() => handleReview("REJECTED")}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Coordinates
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">Select an application to review</p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
