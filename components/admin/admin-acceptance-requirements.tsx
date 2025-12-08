"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"

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

export function AdminAcceptanceRequirements({
  applicationId,
  onUpdated,
}: AdminAcceptanceRequirementsProps) {
  const [requirements, setRequirements] = useState<AcceptanceRequirementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequirements()
  }, [applicationId])

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

  const handleReview = async (requirementId: string, decision: "ACCEPT" | "REJECT") => {
    try {
      setSubmittingId(requirementId)
      setError("")
      const response = await fetch("/api/admin/acceptanceRequirements/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementId,
          decision,
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
        <CardTitle className="text-lg font-semibold text-gray-900">
          Acceptance Requirements
        </CardTitle>
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
                          className="bg-green-600 hover:bg-green-700"
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
                          variant="destructive"
                          disabled={submittingId === req.id}
                          onClick={() => handleReview(req.id, "REJECT")}
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
      </CardContent>
    </Card>
  )
}
