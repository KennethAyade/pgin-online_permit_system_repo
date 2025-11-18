"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle, Clock, FileUp } from "lucide-react"

interface AcceptanceRequirement {
  id: string
  requirementType: string
  requirementName: string
  requirementDescription?: string
  order: number
  status: "PENDING_SUBMISSION" | "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "REVISION_REQUIRED"
  submittedAt?: string
  submittedFileName?: string
  submittedData?: string
  adminRemarks?: string
  adminRemarkFileUrl?: string
  adminRemarkFileName?: string
  revisionDeadline?: string
  autoAcceptDeadline?: string
}

interface AcceptanceRequirementsSectionProps {
  applicationId: string
  applicationNo: string
  projectName?: string
  permitType: string
  currentRequirementId?: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    case "PENDING_REVIEW":
      return <Clock className="h-5 w-5 text-yellow-600" />
    case "REVISION_REQUIRED":
      return <AlertCircle className="h-5 w-5 text-red-600" />
    default:
      return <FileUp className="h-5 w-5 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-100 text-green-800"
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800"
    case "REVISION_REQUIRED":
      return "bg-red-100 text-red-800"
    case "PENDING_SUBMISSION":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function AcceptanceRequirementsSection({
  applicationId,
  applicationNo,
  projectName,
  permitType,
  currentRequirementId,
}: AcceptanceRequirementsSectionProps) {
  const [requirements, setRequirements] = useState<AcceptanceRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequirement, setSelectedRequirement] = useState<AcceptanceRequirement | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionData, setSubmissionData] = useState("")
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchRequirements()
  }, [applicationId])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/acceptanceRequirements/${applicationId}?type=user`)
      const result = await response.json()

      if (result.requirements) {
        setRequirements(result.requirements)
        // Auto-select current requirement
        if (currentRequirementId) {
          const current = result.requirements.find((r: any) => r.id === currentRequirementId)
          if (current) {
            setSelectedRequirement(current)
          }
        }
      }
    } catch (err) {
      setError("Failed to load acceptance requirements")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedRequirement) {
      setError("Please select a requirement")
      return
    }

    // For PROJECT_COORDINATES, require submittedData
    if (selectedRequirement.requirementType === "PROJECT_COORDINATES" && !submissionData) {
      setError("Please enter the project coordinates")
      return
    }

    // For other documents, require file
    if (selectedRequirement.requirementType !== "PROJECT_COORDINATES" && !submissionFile) {
      setError("Please upload a file")
      return
    }

    setSubmitting(true)

    try {
      let submittedFileUrl = null
      let submittedFileName = null

      // Upload file if provided
      if (submissionFile) {
        const formData = new FormData()
        formData.append("file", submissionFile)
        formData.append("applicationId", applicationId)

        const uploadResponse = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("File upload failed")
        }

        const uploadResult = await uploadResponse.json()
        submittedFileUrl = uploadResult.fileUrl
        submittedFileName = submissionFile.name
      }

      // Submit requirement
      const response = await fetch("/api/acceptanceRequirements/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId: selectedRequirement.id,
          submittedData: submissionData || null,
          submittedFileUrl,
          submittedFileName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit requirement")
      }

      setSuccess(`${selectedRequirement.requirementName} submitted successfully!`)
      setSubmissionData("")
      setSubmissionFile(null)
      await fetchRequirements()

      // Reset selection after 2 seconds
      setTimeout(() => setSelectedRequirement(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceptance Requirements - {projectName} ({applicationNo})</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </CardContent>
      </Card>
    )
  }

  const completedCount = requirements.filter((r) => r.status === "ACCEPTED").length
  const totalCount = requirements.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Acceptance Requirements - {projectName} ({applicationNo})</span>
            <Badge variant="outline">
              {completedCount}/{totalCount} Completed
            </Badge>
          </CardTitle>
          <CardDescription>
            Submit your acceptance requirements one by one. Each requirement must be reviewed and
            accepted by admin before proceeding to the next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Requirements List */}
          <div className="space-y-2">
            {requirements.map((req, index) => {
              const isCurrentRequirement = req.id === currentRequirementId
              const isLocked = !isCurrentRequirement && req.status !== "ACCEPTED" && index > 0
              const previousRequirementCompleted =
                index === 0 || requirements[index - 1]?.status === "ACCEPTED"

              return (
                <div
                  key={req.id}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedRequirement?.id === req.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isLocked ? "opacity-50" : ""}`}
                  onClick={() => !isLocked && setSelectedRequirement(req)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(req.status)}
                        <h4 className="font-medium text-gray-900">
                          {req.order}. {req.requirementName}
                        </h4>
                      </div>
                      {req.requirementDescription && (
                        <p className="text-sm text-gray-600 ml-7">{req.requirementDescription}</p>
                      )}

                      {/* Show submitted info */}
                      {req.submittedAt && (
                        <div className="text-xs text-gray-500 mt-1 ml-7">
                          Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                          {req.submittedFileName && ` - ${req.submittedFileName}`}
                        </div>
                      )}

                      {/* Show admin remarks if rejected */}
                      {req.status === "REVISION_REQUIRED" && req.adminRemarks && (
                        <Alert className="mt-2 ml-7 bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>Admin Remarks:</strong> {req.adminRemarks}
                            {req.revisionDeadline && (
                              <div className="mt-1">
                                Resubmit by: {new Date(req.revisionDeadline).toLocaleDateString()}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Badge className={getStatusColor(req.status)}>
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      {selectedRequirement && (selectedRequirement.status === "PENDING_SUBMISSION" || selectedRequirement.status === "REVISION_REQUIRED") && (
        <Card>
          <CardHeader>
            <CardTitle>Submit {selectedRequirement.requirementName}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedRequirement.requirementType === "PROJECT_COORDINATES" ? (
                <div className="space-y-2">
                  <Label htmlFor="coordinates">Project Coordinates (Latitude, Longitude)</Label>
                  <Input
                    id="coordinates"
                    placeholder="e.g., 14.5995, 120.9842"
                    value={submissionData}
                    onChange={(e) => setSubmissionData(e.target.value)}
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500">
                    Enter your project location coordinates for verification
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Document</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    disabled={submitting}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Requirement"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
