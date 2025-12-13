"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"
import { EvaluationChecklist } from "./evaluation-checklist"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface AdminAcceptanceRequirementsProps {
  applicationId: string
  onUpdated?: () => void
}

interface AcceptanceRequirementItem {
  id: string
  requirementName: string
  requirementType: string
  status: string
  submittedFileName?: string | null
  submittedFileUrl?: string | null
}

interface RejectTargetRequirement {
  id: string
  name: string
}

export function AdminAcceptanceRequirements({
  applicationId,
  onUpdated,
}: AdminAcceptanceRequirementsProps) {
  const [requirements, setRequirements] = useState<AcceptanceRequirementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [application, setApplication] = useState<{ permitType: "ISAG" | "CSAG"; status: string } | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<RejectTargetRequirement | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState("")
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  useEffect(() => {
    fetchRequirements()
    fetchApplication()
  }, [applicationId])

  const fetchApplication = async () => {
    if (!applicationId) return
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      }
    } catch (err) {
      console.error("Failed to fetch application:", err)
    }
  }

  // Determine if evaluation is allowed based on application status
  const canEvaluate = application && ["SUBMITTED", "UNDER_REVIEW", "INITIAL_CHECK", "TECHNICAL_REVIEW"].includes(application.status)

  // Determine evaluation type based on application status
  const getEvaluationType = (): "INITIAL_CHECK" | "TECHNICAL_REVIEW" | "FINAL_APPROVAL" => {
    if (!application) return "INITIAL_CHECK"
    if (application.status === "TECHNICAL_REVIEW") return "TECHNICAL_REVIEW"
    return "INITIAL_CHECK"
  }

  const fetchRequirements = async () => {
    if (!applicationId) return
    try {
      setLoading(true)
      setError("")
      // Use admin mode when fetching acceptance requirements so authorization checks allow adminUser
      const response = await fetch(`/api/acceptanceRequirements/${applicationId}?type=admin`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load acceptance requirements")
      }
      const data = await response.json()
      const mapped: AcceptanceRequirementItem[] = (data.requirements || []).map((req: any) => ({
        id: req.id,
        requirementName: req.requirementName,
        requirementType: req.requirementType,
        status: req.status,
        submittedFileName: req.submittedFileName ?? null,
        submittedFileUrl: req.submittedFileUrl ?? null,
      }))
      setRequirements(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load acceptance requirements")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (requirementId: string, decision: "ACCEPT" | "REJECT", adminRemarks?: string) => {
    try {
      setSubmittingId(requirementId)
      setError("")
      const response = await fetch("/api/admin/acceptanceRequirements/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId,
          decision,
          adminRemarks: adminRemarks?.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Review failed")
      }
      await fetchRequirements()
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmittingId(null)
    }
  }

  const openRejectDialog = (requirement: AcceptanceRequirementItem) => {
    setRejectTarget({ id: requirement.id, name: requirement.requirementName })
    setRejectRemarks("")
    setRejectDialogOpen(true)
  }

  const handleRejectWithRemarks = async () => {
    if (!rejectTarget) return
    const trimmedRemarks = rejectRemarks.trim()
    if (!trimmedRemarks) {
      setError("Please provide remarks before rejecting this requirement.")
      return
    }

    try {
      setRejectSubmitting(true)
      await handleReview(rejectTarget.id, "REJECT", trimmedRemarks)
      setRejectDialogOpen(false)
      setRejectTarget(null)
      setRejectRemarks("")
    } finally {
      setRejectSubmitting(false)
    }
  }

  const handleView = (fileUrl?: string | null) => {
    if (!fileUrl) return
    window.open(fileUrl, "_blank")
  }

  if (loading && requirements.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Acceptance Requirements
          </CardTitle>
          {canEvaluate && application && (
            <EvaluationChecklist
              applicationId={applicationId}
              permitType={application.permitType}
              evaluationType={getEvaluationType()}
              mode="acceptance"
              onSuccess={() => {
                fetchRequirements()
                onUpdated?.()
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {requirements.length === 0 ? (
          <p className="text-sm text-gray-500">No acceptance requirements found for this application.</p>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => {
              const isPending = req.status === "PENDING_REVIEW"
              const isAccepted = req.status === "ACCEPTED"

              return (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {isAccepted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : isPending ? (
                        <Loader2 className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{req.requirementName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Type: {req.requirementType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={
                            req.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : req.status === "PENDING_REVIEW"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }
                        >
                          {req.status}
                        </Badge>
                        {req.submittedFileName && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {req.submittedFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.submittedFileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(req.submittedFileUrl)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}

                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={submittingId === req.id}
                          onClick={() => handleReview(req.id, "ACCEPT")}
                        >
                          {submittingId === req.id && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={submittingId === req.id}
                          onClick={() => openRejectDialog(req)}
                        >
                          {submittingId === req.id && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject requirement</DialogTitle>
              <DialogDescription>
                {rejectTarget ? (
                  <span>
                    You are about to reject <strong>{rejectTarget.name}</strong>. Please provide clear
                    remarks so the applicant knows how to revise their submission.
                  </span>
                ) : (
                  "Provide remarks for this rejection."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="acceptance-reject-remarks">
                Remarks
              </label>
              <Textarea
                id="acceptance-reject-remarks"
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                rows={4}
                placeholder="Explain why this requirement is being rejected and what the applicant should change."
              />
              {!rejectRemarks.trim() && (
                <p className="text-xs text-red-600">Remarks are required to reject a requirement.</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (rejectSubmitting) return
                  setRejectDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={rejectSubmitting || !rejectRemarks.trim()}
                onClick={handleRejectWithRemarks}
              >
                {rejectSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
