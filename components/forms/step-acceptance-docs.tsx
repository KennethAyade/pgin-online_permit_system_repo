"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { DOCUMENT_REQUIREMENTS, MAX_FILE_SIZE } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, FileText, CheckCircle2, Upload, X, Loader2, Download } from "lucide-react"

interface StepAcceptanceDocsProps {
  applicationId?: string
  permitType: "ISAG" | "CSAG"
  data: any
  onUpdate: (data: any) => void
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

interface UploadedDocument {
  fileUrl: string
  fileName: string
}

export function StepAcceptanceDocs({
  applicationId,
  permitType,
  data,
  onUpdate,
}: StepAcceptanceDocsProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>(
    data?.uploadedDocuments || {}
  )
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const requirements = permitType === "ISAG"
    ? DOCUMENT_REQUIREMENTS.ISAG.acceptance
    : DOCUMENT_REQUIREMENTS.CSAG.acceptance

  // Sync local state with parent data
  useEffect(() => {
    if (data?.uploadedDocuments) {
      setUploadedDocuments(data.uploadedDocuments)
    }
  }, [data?.uploadedDocuments])

  const handleFileUpload = async (docType: string, file: File) => {
    if (!applicationId) return

    setUploadingStates(prev => ({ ...prev, [docType]: true }))
    setErrors(prev => ({ ...prev, [docType]: "" }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("applicationId", applicationId)
      formData.append("documentType", docType)
      formData.append("documentName", DOCUMENT_LABELS[docType] || docType)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors(prev => ({ ...prev, [docType]: result.error || "Upload failed" }))
        return
      }

      // Update local state with uploaded document info
      const newUploadedDocs = {
        ...uploadedDocuments,
        [docType]: {
          fileUrl: result.document.fileUrl,
          fileName: result.document.fileName,
        }
      }

      setUploadedDocuments(newUploadedDocs)

      // Notify parent component
      onUpdate({ uploadedDocuments: newUploadedDocs })
    } catch (error) {
      setErrors(prev => ({ ...prev, [docType]: "An error occurred during upload" }))
    } finally {
      setUploadingStates(prev => ({ ...prev, [docType]: false }))
    }
  }

  const handleFileDelete = async (docType: string) => {
    if (!uploadedDocuments[docType]) return

    // Remove from local state
    const newUploadedDocs = { ...uploadedDocuments }
    delete newUploadedDocs[docType]
    setUploadedDocuments(newUploadedDocs)

    // Notify parent component
    onUpdate({ uploadedDocuments: newUploadedDocs })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Acceptance Requirements</h3>
        <p className="text-sm text-gray-600">
          Upload all required documents at once. Each document must be in PDF format, maximum 10MB. After submitting, the admin can review all documents in any order.
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
              <strong>Batch Upload:</strong> You can upload all acceptance requirements at once. The admin will review each document and may approve or request revisions for any of them. Each requirement has a 14 working days deadline for admin review.
            </AlertDescription>
          </Alert>

          {/* Document Upload Requirements */}
          <div className="space-y-4">
            {requirements.map((docType, index) => {
              const isUploaded = !!uploadedDocuments[docType]
              const isUploading = uploadingStates[docType]
              const error = errors[docType]

              return (
                <div
                  key={docType}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg mt-1">
                      <FileText className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {DOCUMENT_LABELS[docType] || docType}
                        </h4>
                        {isUploaded && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Document Display */}
                  {isUploaded && (
                    <div className="mb-3 flex items-center justify-between p-3 bg-white border-2 border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-700" />
                        <span className="text-sm font-medium text-gray-900">
                          {uploadedDocuments[docType].fileName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileDelete(docType)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* File Upload Dropzone */}
                  <FileUploadZone
                    docType={docType}
                    isUploaded={isUploaded}
                    isUploading={isUploading}
                    onFileSelect={(file) => handleFileUpload(docType, file)}
                  />

                  {/* Upload Status */}
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive" className="mt-2 border-red-300 bg-red-50">
                      <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )
            })}
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>Next Steps:</strong> After uploading all documents and submitting your application, the admin will review each requirement. If any requirement needs revision, you'll have 14 working days to resubmit. If the admin doesn't review within 14 working days, the requirement will be automatically approved.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}

// File Upload Zone Component
function FileUploadZone({
  docType,
  isUploaded,
  isUploading,
  onFileSelect
}: {
  docType: string
  isUploaded: boolean
  isUploading: boolean
  onFileSelect: (file: File) => void
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : isUploaded
          ? "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
      <p className="text-xs font-medium text-gray-700">
        {isDragActive
          ? "Drop the PDF file here"
          : isUploaded
          ? "Drag & drop to replace, or click to select"
          : "Drag & drop a PDF file here, or click to select"}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        PDF only, max {MAX_FILE_SIZE / 1024 / 1024}MB
      </p>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}
