"use client"

import { useState, useEffect } from "react"
import { DocumentUpload } from "@/components/application/document-upload"
import { DOCUMENT_REQUIREMENTS } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, FileText, CheckCircle2 } from "lucide-react"

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

export function StepAcceptanceDocs({
  applicationId,
  permitType,
  data,
  onUpdate,
}: StepAcceptanceDocsProps) {
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    if (applicationId) {
      fetchDocuments()
    }
  }, [applicationId])

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

  const handleUploadComplete = (docType: string) => {
    fetchDocuments()
  }

  const isDocumentUploaded = (docType: string) => {
    return documents.some((doc) => doc.documentType === docType)
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
              <strong>Document Requirements:</strong> All documents must be clear, legible, and properly signed/sealed where required. Your project coordinates have already been approved in Step 2.
            </AlertDescription>
          </Alert>

          {/* Document Upload Requirements */}
          <div className="space-y-4">
            {requirements.map((docType, index) => (
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
                      {isDocumentUploaded(docType) && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
                <DocumentUpload
                  applicationId={applicationId}
                  documentType={docType}
                  documentName={DOCUMENT_LABELS[docType] || docType}
                  onUploadSuccess={() => handleUploadComplete(docType)}
                  existingDocument={documents.find((d) => d.documentType === docType)}
                />
              </div>
            ))}
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>Reminder:</strong> After submitting your application, each document will be reviewed by the admin one at a time. You will be notified when each document is accepted or if revisions are needed.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}
