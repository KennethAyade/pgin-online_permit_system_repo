"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MAX_FILE_SIZE } from "@/lib/constants"
import { Loader2, CheckCircle2, AlertCircle, Clock, FileUp, Upload, X, Download } from "lucide-react"

interface OtherDocument {
  id: string
  documentType: string
  documentName: string
  status: "PENDING_SUBMISSION" | "PENDING_REVIEW" | "ACCEPTED" | "REVISION_REQUIRED"
  submittedAt?: string
  submittedFileName?: string
  submittedFileUrl?: string
  adminRemarks?: string
  adminRemarkFileUrl?: string
  adminRemarkFileName?: string
  revisionDeadline?: string
  autoAcceptDeadline?: string
}

interface OtherDocumentsSectionProps {
  applicationId: string
  applicationNo: string
  projectName?: string
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

export function OtherDocumentsSection({
  applicationId,
  applicationNo,
  projectName,
}: OtherDocumentsSectionProps) {
  const [documents, setDocuments] = useState<OtherDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<OtherDocument | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [applicationId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/otherDocuments/${applicationId}`)
      const result = await response.json()

      if (result.documents) {
        setDocuments(result.documents)
        // Auto-select first non-accepted document or first document
        const firstPending = result.documents.find(
          (d: any) => d.status === "PENDING_SUBMISSION" || d.status === "REVISION_REQUIRED"
        )
        if (firstPending) {
          setSelectedDocument(firstPending)
        } else if (result.documents.length > 0) {
          setSelectedDocument(result.documents[0])
        }
      }
    } catch (err) {
      setError("Failed to load other documents")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedDocument || !submissionFile) {
      setError("Please select a file to upload")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      // Upload file first
      const formData = new FormData()
      formData.append("file", submissionFile)
      formData.append("applicationId", applicationId)
      formData.append("documentType", selectedDocument.documentType)
      formData.append("documentName", selectedDocument.documentName)

      const uploadResponse = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok) {
        setError(uploadResult.error || "File upload failed")
        return
      }

      // Submit the other document
      const submitResponse = await fetch("/api/otherDocuments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          submittedFileUrl: uploadResult.document.fileUrl,
          submittedFileName: uploadResult.document.fileName,
        }),
      })

      const submitResult = await submitResponse.json()

      if (!submitResponse.ok) {
        setError(submitResult.error || "Submission failed")
        return
      }

      setSuccess("Document submitted successfully!")
      setSubmissionFile(null)
      fetchDocuments()

      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Submission error:", error)
      setError("An error occurred during submission")
    } finally {
      setSubmitting(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSubmissionFile(acceptedFiles[0])
      setError("")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: submitting,
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  const canSubmit = selectedDocument?.status === "PENDING_SUBMISSION" || selectedDocument?.status === "REVISION_REQUIRED"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Other Requirements</CardTitle>
          <CardDescription>
            Upload additional supporting documents for Application {applicationNo}
            {projectName && ` - ${projectName}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents List */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Document List</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedDocument?.id === doc.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(doc.status)}
                          <h4 className="text-sm font-medium text-gray-900">{doc.documentName}</h4>
                        </div>
                        {doc.submittedAt && (
                          <div className="text-xs text-gray-500 ml-7">
                            Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Details & Upload */}
            <div className="lg:col-span-2">
              {selectedDocument ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedDocument.documentName}
                    </h3>
                    <Badge className={getStatusColor(selectedDocument.status)}>
                      {selectedDocument.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Submitted File */}
                  {selectedDocument.submittedFileName && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              {selectedDocument.submittedFileName}
                            </p>
                            <p className="text-xs text-green-700">
                              Submitted: {new Date(selectedDocument.submittedAt!).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {selectedDocument.submittedFileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedDocument.submittedFileUrl, "_blank")}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Remarks */}
                  {selectedDocument.adminRemarks && (
                    <Alert className="border-yellow-300 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-700" />
                      <AlertDescription className="text-yellow-900">
                        <div className="font-semibold mb-1">Admin Remarks:</div>
                        <p className="text-sm">{selectedDocument.adminRemarks}</p>
                        {selectedDocument.adminRemarkFileName && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 p-0 h-auto text-yellow-700"
                            onClick={() => window.open(selectedDocument.adminRemarkFileUrl, "_blank")}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {selectedDocument.adminRemarkFileName}
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Upload Section */}
                  {canSubmit && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">
                        {selectedDocument.status === "REVISION_REQUIRED" ? "Resubmit Document" : "Upload Document"}
                      </h4>

                      {submissionFile ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                {submissionFile.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSubmissionFile(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                            isDragActive
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {isDragActive ? "Drop the PDF file here" : "Drag & drop a PDF file here, or click to select"}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF only, max {MAX_FILE_SIZE / 1024 / 1024}MB
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleFileUpload}
                        disabled={!submissionFile || submitting}
                        className="w-full mt-4"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Document"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {success && (
                    <Alert className="border-green-300 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive" className="border-red-300 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Deadlines */}
                  {selectedDocument.revisionDeadline && (
                    <Alert className="border-amber-300 bg-amber-50">
                      <Clock className="h-4 w-4 text-amber-700" />
                      <AlertDescription className="text-amber-900">
                        <strong>Revision Deadline:</strong>{" "}
                        {new Date(selectedDocument.revisionDeadline).toLocaleDateString()} - You have 14 working days to resubmit.
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedDocument.autoAcceptDeadline && selectedDocument.status === "PENDING_REVIEW" && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Clock className="h-4 w-4 text-blue-700" />
                      <AlertDescription className="text-blue-800">
                        <strong>Admin Review Deadline:</strong>{" "}
                        {new Date(selectedDocument.autoAcceptDeadline).toLocaleDateString()} - If not reviewed, this will be auto-approved.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Select a document from the list to view details
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
