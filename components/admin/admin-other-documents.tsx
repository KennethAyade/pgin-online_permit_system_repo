"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react"

interface AdminOtherDocumentsProps {
  applicationId: string
  onUpdated?: () => void
}

interface AdminOtherDocumentItem {
  id: string
  documentType: string
  documentName: string
  status: "PENDING_SUBMISSION" | "PENDING_REVIEW" | "ACCEPTED" | "REVISION_REQUIRED"
  submittedAt?: string | null
  submittedFileName?: string | null
  submittedFileUrl?: string | null
  adminRemarks?: string | null
  revisionDeadline?: string | null
  autoAcceptDeadline?: string | null
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
      return <FileText className="h-5 w-5 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-green-100 text-green-800 border-green-300"
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "REVISION_REQUIRED":
      return "bg-red-100 text-red-800 border-red-300"
    case "PENDING_SUBMISSION":
      return "bg-blue-100 text-blue-800 border-blue-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

export function AdminOtherDocuments({ applicationId, onUpdated }: AdminOtherDocumentsProps) {
  const [documents, setDocuments] = useState<AdminOtherDocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [applicationId])

  const fetchDocuments = async () => {
    if (!applicationId) return
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/admin/otherDocuments/${applicationId}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load other documents")
      }
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load other documents")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (fileUrl?: string | null) => {
    if (!fileUrl) return
    window.open(fileUrl, "_blank")
  }

  const handleReview = async (documentId: string, decision: "ACCEPT" | "REJECT") => {
    try {
      setSubmittingId(documentId)
      setError("")
      const response = await fetch("/api/admin/otherDocuments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          decision,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Review failed")
      }
      await fetchDocuments()
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading && documents.length === 0) {
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
          Other Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No other documents found for this application.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const isPending = doc.status === "PENDING_REVIEW"

              return (
                <div
                  key={doc.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{doc.documentName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Type: {doc.documentType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.replace(/_/g, " ")}
                        </Badge>
                        {doc.submittedFileName && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {doc.submittedFileName}
                          </span>
                        )}
                      </div>
                      {doc.adminRemarks && (
                        <p className="text-xs text-red-700 mt-1">
                          Admin remarks: {doc.adminRemarks}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.submittedFileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc.submittedFileUrl)}
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
                          disabled={submittingId === doc.id}
                          onClick={() => handleReview(doc.id, "ACCEPT")}
                        >
                          {submittingId === doc.id && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={submittingId === doc.id}
                          onClick={() => handleReview(doc.id, "REJECT")}
                        >
                          {submittingId === doc.id && (
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
