"use client"

import { useState, useEffect } from "react"
import { DOCUMENT_REQUIREMENTS, MAX_FILE_SIZE } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Info, FileCheck, Upload, X, Loader2 } from "lucide-react"

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

      // Notify parent component (wizard state)
      onUpdate({ uploadedDocuments: newUploadedDocs })

      // Persist uploadedDocuments to the Application record immediately
      // so that acceptanceRequirements/initialize and subsequent GET
      // calls can reliably map these files into AcceptanceRequirement
      // rows without relying solely on the auto-save debounce.
      try {
        await fetch(`/api/applications/${applicationId}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadedDocuments: newUploadedDocs }),
        })
      } catch (err) {
        console.error("Error persisting uploadedDocuments to draft:", err)
      }
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
              <strong>Batch Upload:</strong> Upload all required documents. The admin will review each document and may approve or request revisions. Each requirement has a 14 working days deadline for admin review.
            </AlertDescription>
          </Alert>

          {/* Simple List-Style Document Upload */}
          <div className="space-y-3">
            {requirements.map((docType) => {
              const isUploaded = !!uploadedDocuments[docType]
              const isUploading = uploadingStates[docType]
              const error = errors[docType]

              return (
                <div key={docType}>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">
                        {DOCUMENT_LABELS[docType] || docType}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>

                      {/* Show uploaded file */}
                      {isUploaded && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            {uploadedDocuments[docType].fileName}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleFileDelete(docType)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove file"
                            disabled={isUploading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Show upload progress */}
                      {isUploading && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading...
                        </p>
                      )}

                      {/* Show error */}
                      {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      )}
                    </div>

                    {/* Upload button */}
                    <div className="ml-4">
                      <input
                        type="file"
                        id={`file-${docType}`}
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > MAX_FILE_SIZE) {
                              setErrors(prev => ({
                                ...prev,
                                [docType]: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB`
                              }))
                              e.target.value = ''
                              return
                            }
                            handleFileUpload(docType, file)
                          }
                        }}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor={`file-${docType}`}
                        className={`cursor-pointer px-4 py-2 text-white text-sm rounded inline-flex items-center gap-2 ${
                          isUploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        {isUploaded ? 'Replace File' : 'Choose File'}
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Alert className="border-green-200 bg-green-50">
            <Info className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>Note:</strong> PDF files only, max {MAX_FILE_SIZE / 1024 / 1024}MB per file. After submitting, the admin will review each document.
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-700" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>What happens next?</strong> After you submit your application, these uploaded files will be converted into Acceptance Requirements for admin review. You can track their status and respond to any revision requests from your Application Details page.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}

