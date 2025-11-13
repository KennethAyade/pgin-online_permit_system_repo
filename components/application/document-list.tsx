"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { File, Download, CheckCircle2, XCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DocumentListProps {
  documents: any[]
  applicationId: string
  applicationStatus: string
}

const DOCUMENT_LABELS: Record<string, string> = {
  APPLICATION_FORM: "Application Form (MGB Form 8-4)",
  SURVEY_PLAN: "Survey Plan",
  LOCATION_MAP: "Location Map",
  WORK_PROGRAM: "Work Program",
  IEE_REPORT: "IEE Report",
  EPEP: "EPEP",
  PROOF_TECHNICAL_COMPETENCE: "Proof of Technical Competence",
  PROOF_FINANCIAL_CAPABILITY: "Proof of Financial Capability",
  ARTICLES_INCORPORATION: "Articles of Incorporation",
  OTHER_SUPPORTING_PAPERS: "Other Supporting Papers",
  AREA_STATUS_CLEARANCE_CENRO: "Area Status & Clearance (CENRO)",
  AREA_STATUS_CLEARANCE_MGB: "Area Status & Clearance (MGB)",
  CERTIFICATE_POSTING_BARANGAY: "Certificate of Posting (Barangay)",
  CERTIFICATE_POSTING_MUNICIPAL: "Certificate of Posting (Municipal)",
  CERTIFICATE_POSTING_PROVINCIAL: "Certificate of Posting (Provincial)",
  CERTIFICATE_POSTING_CENRO: "Certificate of Posting (CENRO)",
  CERTIFICATE_POSTING_PENRO: "Certificate of Posting (PENRO)",
  CERTIFICATE_POSTING_MGB: "Certificate of Posting (MGB)",
  ECC: "ECC",
  SANGGUNIAN_ENDORSEMENT_BARANGAY: "Sanggunian Endorsement (Barangay)",
  SANGGUNIAN_ENDORSEMENT_MUNICIPAL: "Sanggunian Endorsement (Municipal)",
  SANGGUNIAN_ENDORSEMENT_PROVINCIAL: "Sanggunian Endorsement (Provincial)",
  FIELD_VERIFICATION_REPORT: "Field Verification Report",
  SURETY_BOND: "Surety Bond",
}

export function DocumentList({ documents, applicationId, applicationStatus }: DocumentListProps) {
  const handleDownload = (documentId: string) => {
    window.open(`/api/documents/${documentId}`, "_blank")
  }

  if (documents.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents uploaded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Documents</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${document.isComplete ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <File className={`h-5 w-5 ${document.isComplete ? 'text-green-700' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {DOCUMENT_LABELS[document.documentType] || document.documentType}
                  </p>
                  <p className="text-xs text-gray-500">
                    {document.fileName} • Version {document.version}
                  </p>
                  {document.remarks && (
                    <p className="text-xs text-gray-600 mt-1 italic">{document.remarks}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {document.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document.id)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
