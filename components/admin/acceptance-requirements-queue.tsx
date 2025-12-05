"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react"

interface RequirementItem {
  id: string
  applicationId: string
  applicationNo: string
  projectName?: string
  permitType: string
  requirementName: string
  requirementType: string
  order: number
  status: string
  submittedAt?: string
  submittedData?: string
  submittedFileName?: string
  autoAcceptDeadline?: string
  daysUntilAutoAccept?: number
  applicant: {
    id: string
    fullName: string
    email: string
  }
}

interface OverlapResult {
  hasOverlap: boolean
  overlappingProjects: Array<{
    applicationId: string
    applicationNo: string
    projectName: string | null
    permitType: string
  }>
  checkedAgainst: number
}

interface AdminAcceptanceRequirementsQueueProps {
  onRequirementReviewed?: () => void
}

const getDeadlineColor = (daysLeft?: number) => {
  if (!daysLeft) return "text-gray-600"
  if (daysLeft <= 2) return "text-red-600 font-bold"
  if (daysLeft <= 5) return "text-yellow-600"
  return "text-gray-600"
}

export function AdminAcceptanceRequirementsQueue({
  onRequirementReviewed,
}: AdminAcceptanceRequirementsQueueProps) {
  const [requirements, setRequirements] = useState<RequirementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementItem | null>(null)
  const [decision, setDecision] = useState<"ACCEPT" | "REJECT" | null>(null)
  const [adminRemarks, setAdminRemarks] = useState("")
  const [adminFile, setAdminFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [permitFilter, setPermitFilter] = useState("")
  const [skip, setSkip] = useState(0)
  const [take] = useState(10)
  const [total, setTotal] = useState(0)
  const [overlapResult, setOverlapResult] = useState<OverlapResult | null>(null)
  const [checkingOverlap, setCheckingOverlap] = useState(false)

  useEffect(() => {
    fetchRequirements()
  }, [skip, permitFilter])

  // Check for coordinate overlaps when PROJECT_COORDINATES is selected
  useEffect(() => {
    const checkOverlap = async () => {
      if (
        selectedRequirement?.requirementType === "PROJECT_COORDINATES" &&
        selectedRequirement.submittedData
      ) {
        setCheckingOverlap(true)
        try {
          const coordinates = JSON.parse(selectedRequirement.submittedData)
          const response = await fetch("/api/admin/acceptanceRequirements/checkOverlap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              coordinates,
              applicationId: selectedRequirement.applicationId,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            setOverlapResult(result)
          }
        } catch (err) {
          console.error("Overlap check failed:", err)
        } finally {
          setCheckingOverlap(false)
        }
      } else {
        setOverlapResult(null)
      }
    }

    checkOverlap()
  }, [selectedRequirement])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/acceptanceRequirements/pending?skip=${skip}&take=${take}`
      if (permitFilter) {
        url += `&permitType=${permitFilter}`
      }

      const response = await fetch(url)
      const result = await response.json()

      if (result.requirements) {
        setRequirements(result.requirements)
        setTotal(result.pagination.total)
      }
    } catch (err) {
      setError("Failed to load pending requirements")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (reviewDecision: "ACCEPT" | "REJECT") => {
    if (!selectedRequirement) return

    setError("")
    setSuccess("")
    setSubmitting(true)

    try {
      let adminRemarkFileUrl = undefined
      let adminRemarkFileName = undefined

      // Upload admin file if provided
      if (adminFile) {
        const formData = new FormData()
        formData.append("file", adminFile)
        formData.append("applicationId", selectedRequirement.applicationId)

        const uploadResponse = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Admin file upload failed")
        }

        const uploadResult = await uploadResponse.json()
        adminRemarkFileUrl = uploadResult.fileUrl
        adminRemarkFileName = adminFile.name
      }

      const response = await fetch("/api/admin/acceptanceRequirements/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId: selectedRequirement.id,
          decision: reviewDecision,
          adminRemarks: adminRemarks || undefined,
          adminRemarkFileUrl,
          adminRemarkFileName,
          isCompliant: reviewDecision === "ACCEPT" ? true : false, // Auto-check compliant on accept
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Review failed")
      }

      setSuccess(
        `Requirement ${reviewDecision === "ACCEPT" ? "accepted" : "rejected"} successfully!`
      )
      setAdminRemarks("")
      setAdminFile(null)
      setDecision(null)
      setSelectedRequirement(null)

      await fetchRequirements()
      onRequirementReviewed?.()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed")
    } finally {
      setSubmitting(false)
    }
  }

  const pages = Math.ceil(total / take)
  const currentPage = Math.floor(skip / take) + 1

  if (loading && requirements.length === 0) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Acceptance Requirements Review Queue</h2>
        <p className="text-gray-600">
          Total pending reviews: <strong>{total}</strong>
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={permitFilter === "" ? "default" : "outline"}
          onClick={() => {
            setPermitFilter("")
            setSkip(0)
          }}
        >
          All Permits
        </Button>
        <Button
          variant={permitFilter === "ISAG" ? "default" : "outline"}
          onClick={() => {
            setPermitFilter("ISAG")
            setSkip(0)
          }}
        >
          ISAG Only
        </Button>
        <Button
          variant={permitFilter === "CSAG" ? "default" : "outline"}
          onClick={() => {
            setPermitFilter("CSAG")
            setSkip(0)
          }}
        >
          CSAG Only
        </Button>
      </div>

      {/* Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending requirements to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Permit Type</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Days to Auto-Accept</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req) => (
                    <TableRow
                      key={req.id}
                      className={selectedRequirement?.id === req.id ? "bg-blue-50" : ""}
                    >
                      <TableCell className="font-mono text-sm">{req.applicationNo}</TableCell>
                      <TableCell>{req.projectName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.permitType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{req.requirementName}</div>
                          <div className="text-xs text-gray-500">{req.order}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{req.applicant.fullName}</div>
                          <div className="text-xs text-gray-500">{req.applicant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {req.submittedAt
                          ? new Date(req.submittedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={getDeadlineColor(req.daysUntilAutoAccept)}>
                          {req.daysUntilAutoAccept ?? "-"} days
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={
                            selectedRequirement?.id === req.id ? "default" : "outline"
                          }
                          onClick={() => setSelectedRequirement(req)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {pages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSkip(Math.max(0, skip - take))}
                  disabled={skip === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSkip(skip + take)}
                  disabled={currentPage >= pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Panel */}
      {selectedRequirement && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Review Requirement</CardTitle>
            <CardDescription>
              Application: {selectedRequirement.applicationNo} | Project:{" "}
              {selectedRequirement.projectName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Requirement Details */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Requirement Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedRequirement.requirementName}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedRequirement.requirementType}
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>{" "}
                  {selectedRequirement.submittedAt
                    ? new Date(selectedRequirement.submittedAt).toLocaleString()
                    : "Not yet submitted"}
                </div>
                {selectedRequirement.submittedFileName && (
                  <div>
                    <span className="font-medium">File:</span>{" "}
                    {selectedRequirement.submittedFileName}
                  </div>
                )}
              </div>
            </div>

            {/* Project Coordinates Display */}
            {selectedRequirement.requirementType === "PROJECT_COORDINATES" && selectedRequirement.submittedData && (
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold mb-3">Submitted Coordinates</h4>
                {(() => {
                  try {
                    const coords = JSON.parse(selectedRequirement.submittedData)
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {["point1", "point2", "point3", "point4"].map((point, index) => (
                          <div key={point} className="bg-gray-50 p-3 rounded border">
                            <div className="font-medium text-sm text-gray-700 mb-1">
                              Point {index + 1}
                            </div>
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="text-gray-500">Lat:</span>{" "}
                                <span className="font-mono">{coords[point]?.latitude}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Lng:</span>{" "}
                                <span className="font-mono">{coords[point]?.longitude}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  } catch {
                    return <p className="text-red-600 text-sm">Failed to parse coordinates</p>
                  }
                })()}
              </div>
            )}

            {/* Overlap Check Results */}
            {selectedRequirement.requirementType === "PROJECT_COORDINATES" && (
              <div className="space-y-2">
                {checkingOverlap && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Checking for overlaps with existing projects...
                    </AlertDescription>
                  </Alert>
                )}

                {overlapResult && !checkingOverlap && (
                  <>
                    {overlapResult.hasOverlap ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-2">
                            WARNING: Coordinates overlap with {overlapResult.overlappingProjects.length} existing project(s)
                          </div>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {overlapResult.overlappingProjects.map((project) => (
                              <li key={project.applicationId}>
                                {project.applicationNo} - {project.projectName || "Unnamed"} ({project.permitType})
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-sm">
                            Please reject this requirement and ask the applicant to verify their project boundaries.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          No overlaps detected. Checked against {overlapResult.checkedAgainst} existing project(s).
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Admin Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Admin Remarks/Comments (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Enter your review comments, reasons for rejection, or instructions for revision..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                disabled={submitting}
                rows={4}
              />
            </div>

            {/* Admin File Upload */}
            <div className="space-y-2">
              <Label htmlFor="adminFile">Attach File (Optional)</Label>
              <Input
                id="adminFile"
                type="file"
                onChange={(e) => setAdminFile(e.target.files?.[0] || null)}
                disabled={submitting}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-gray-500">
                Upload a file to send with your remarks (e.g., annotated documents, reference files)
              </p>
              {adminFile && (
                <p className="text-xs text-blue-600">
                  Selected: {adminFile.name}
                </p>
              )}
            </div>

            {/* Compliance Checklist (REVISION 4 & 7) */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Label className="text-sm font-semibold text-gray-900">
                Document Compliance Evaluation
              </Label>
              <p className="text-xs text-gray-600 mb-3">
                Mark document as compliant or non-compliant. Compliant checkbox will be automatically checked when you click Accept.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="compliant"
                    checked={decision === "ACCEPT"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDecision("ACCEPT")
                      } else if (decision === "ACCEPT") {
                        setDecision(null)
                      }
                    }}
                    disabled={submitting}
                  />
                  <Label htmlFor="compliant" className="text-sm font-medium text-green-700 cursor-pointer">
                    ✓ Compliant
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="non-compliant"
                    checked={decision === "REJECT"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDecision("REJECT")
                      } else if (decision === "REJECT") {
                        setDecision(null)
                      }
                    }}
                    disabled={submitting}
                  />
                  <Label htmlFor="non-compliant" className="text-sm font-medium text-red-700 cursor-pointer">
                    ✗ Non-compliant
                  </Label>
                </div>
              </div>
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  <strong>Auto-Check Feature:</strong> When you click "Accept Requirement" below, the Compliant checkbox will be automatically checked. You only need to manually select "Non-compliant" if rejecting.
                </AlertDescription>
              </Alert>
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleReview("ACCEPT")}
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Requirement
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => handleReview("REJECT")}
                disabled={submitting}
                variant="destructive"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject (Request Revision)
              </Button>
            </div>

            <p className="text-xs text-gray-600">
              Auto-accept deadline: {selectedRequirement.autoAcceptDeadline ? new Date(selectedRequirement.autoAcceptDeadline).toLocaleDateString() : "N/A"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
