"use client"

import { useState, useEffect } from "react"
import { DocumentUpload } from "@/components/application/document-upload"
import { DOCUMENT_REQUIREMENTS } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, FileText } from "lucide-react"

interface StepOtherRequirementsProps {
  applicationId?: string
  data: any
  onUpdate: (data: any) => void
}

const DOCUMENT_LABELS: Record<string, string> = {
  AREA_STATUS_CLEARANCE_CENRO: "Area Status & Clearance (CENRO)",
  AREA_STATUS_CLEARANCE_MGB: "Area Status & Clearance (MGB Regional Office)",
  CERTIFICATE_POSTING_BARANGAY: "Certificate of Posting (Barangay)",
  CERTIFICATE_POSTING_MUNICIPAL: "Certificate of Posting (Municipal Government)",
  CERTIFICATE_POSTING_PROVINCIAL: "Certificate of Posting (Provincial Government)",
  CERTIFICATE_POSTING_CENRO: "Certificate of Posting (CENRO)",
  CERTIFICATE_POSTING_PENRO: "Certificate of Posting (PENRO)",
  CERTIFICATE_POSTING_MGB: "Certificate of Posting (MGB Regional Office)",
  ECC: "Environmental Compliance Certificate (ECC)",
  SANGGUNIAN_ENDORSEMENT_BARANGAY: "Sanggunian Endorsement (Barangay)",
  SANGGUNIAN_ENDORSEMENT_MUNICIPAL: "Sanggunian Endorsement (Municipal)",
  SANGGUNIAN_ENDORSEMENT_PROVINCIAL: "Sanggunian Endorsement (Provincial)",
  FIELD_VERIFICATION_REPORT: "Field Verification Report",
  SURETY_BOND: "Surety Bond (₱20,000.00)",
}

export function StepOtherRequirements({
  applicationId,
  data,
  onUpdate,
}: StepOtherRequirementsProps) {
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

  // Other requirements are the same for both ISAG and CSAG
  const requirements = DOCUMENT_REQUIREMENTS.ISAG.other

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Other Requirements</h3>
        <p className="text-sm text-gray-600">
          Upload additional required documents. Five (5) sets are required for some documents.
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
              These documents support your application and demonstrate compliance with environmental and regulatory requirements.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {requirements.map((docType, index) => {
              const existingDoc = documents.find(
                (doc) => doc.documentType === docType
              )

              return (
                <div key={docType} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-green-100 p-2 rounded-lg mt-1">
                      <FileText className="h-4 w-4 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {DOCUMENT_LABELS[docType] || docType}
                        </h4>
                      </div>
                      <DocumentUpload
                        applicationId={applicationId}
                        documentType={docType}
                        documentName={DOCUMENT_LABELS[docType] || docType}
                        onUploadSuccess={fetchDocuments}
                        existingDocument={existingDoc}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
