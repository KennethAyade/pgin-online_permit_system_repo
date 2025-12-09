"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { File, Download, CheckCircle2, XCircle, FileText, AlertTriangle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DocumentUpload } from "@/components/application/document-upload"

interface DocumentListProps {
  documents: any[]
  otherDocuments?: any[]
  applicationId: string
  applicationStatus: string
  canEdit?: boolean
  onRefresh?: () => void
  evaluations?: any[]
  // mode="admin" is used on the admin side to enable special actions
  mode?: "user" | "admin"
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
  // OtherDocument types
  BUSINESS_PERMIT: "Business Permit",
  LGU_ENDORSEMENT: "LGU Endorsement",
  COMMUNITY_CONSENT: "Community Consent",
  ANCESTRAL_DOMAIN_CLEARANCE: "Ancestral Domain Clearance",
}

export function DocumentList({
  documents,
  otherDocuments = [],
  applicationId,
  applicationStatus,
  canEdit = false,
  onRefresh,
  evaluations,
  mode = "user",
}: DocumentListProps) {
  const [previewDocument, setPreviewDocument] = useState<any | null>(null)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [reviewingConsentId, setReviewingConsentId] = useState<string | null>(null)

  // Collect checklist items that are explicitly compliant / non-compliant with their remarks
  const nonCompliantItems = new Map<string, { remarks: string | null; checkedBy: string | null }>()
  const compliantItems = new Map<string, { checkedBy: string | null }>()

  if (evaluations && evaluations.length > 0) {
    for (const evaluation of evaluations) {
      if (!evaluation?.checklistItems) continue
      for (const item of evaluation.checklistItems) {
        if (item?.category === "DOCUMENT_VERIFICATION") {
          if (item.isCompliant === false) {
            nonCompliantItems.set(item.itemName, {
              remarks: item.remarks || null,
              checkedBy: evaluation.evaluator?.fullName || null,
            })
          } else if (item.isCompliant === true) {
            compliantItems.set(item.itemName, {
              checkedBy: evaluation.evaluator?.fullName || null,
            })
          }
        }
      }
    }
  }

  // Helper functions to get evaluation info for a document
  const getNonCompliantInfo = (label: string, documentType: string) => {
    return nonCompliantItems.get(label) || nonCompliantItems.get(documentType) || null
  }

  const getCompliantInfo = (label: string, documentType: string) => {
    return compliantItems.get(label) || compliantItems.get(documentType) || null
  }

  // Merge documents and otherDocuments into a unified list
  // Add a flag to distinguish between types for download/preview handling
  const allDocuments = [
    ...documents.map(doc => ({ ...doc, _isOtherDocument: false })),
    ...otherDocuments.map(doc => ({
      ...doc,
      _isOtherDocument: true,
      // Map OtherDocument fields to Document fields for consistent rendering
      fileName: doc.submittedFileName || "N/A",
      fileUrl: doc.submittedFileUrl,
      isComplete: !!doc.submittedFileUrl,
      version: 1, // OtherDocuments don't have versions
    }))
  ]

  const handleDownload = (documentId: string, isOtherDocument: boolean) => {
    if (isOtherDocument) {
      window.open(`/api/otherDocuments/${documentId}/download`, "_blank")
    } else {
      window.open(`/api/documents/${documentId}`, "_blank")
    }
  }

  const handleConsentDecision = async (
    document: any,
    decision: "ACCEPT" | "REJECT"
  ) => {
    try {
      setReviewingConsentId(document.id)

      let adminRemarks: string | undefined
      if (decision === "REJECT") {
        const input = window.prompt(
          "Enter remarks for rejecting the consent letter (required):"
        )
        if (!input || !input.trim()) {
          return
        }
        adminRemarks = input.trim()
      }

      const response = await fetch("/api/admin/consentLetters/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          decision,
          adminRemarks,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        alert(data.error || "Failed to review consent letter")
        return
      }

      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Consent review error:", error)
      alert("An error occurred while reviewing the consent letter.")
    } finally {
      setReviewingConsentId(null)
    }
  }

  if (allDocuments.length === 0) {
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
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Documents</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-3">
            {allDocuments.map((document) => {
              const label = DOCUMENT_LABELS[document.documentType] || document.documentType
              const isOtherDocument = document._isOtherDocument

              // For OtherDocuments, use their status field instead of evaluation
              let isNonCompliant = false
              let isExplicitlyCompliant = false
              let isUploaded = !!document.isComplete
              let hasEvaluation = false
              let nonCompliantInfo = null
              let compliantInfo = null

              if (isOtherDocument) {
                // OtherDocuments have their own status field
                isUploaded = !!document.submittedFileUrl
                isExplicitlyCompliant = document.status === "ACCEPTED"
                isNonCompliant = document.status === "REVISION_REQUIRED"
                hasEvaluation = isExplicitlyCompliant || isNonCompliant

                if (isNonCompliant && document.adminRemarks) {
                  nonCompliantInfo = {
                    remarks: document.adminRemarks,
                    checkedBy: null // OtherDocuments don't track reviewer name directly
                  }
                }
              } else {
                // Regular Documents use evaluation checklist
                nonCompliantInfo = getNonCompliantInfo(label, document.documentType)
                compliantInfo = getCompliantInfo(label, document.documentType)
                isNonCompliant = nonCompliantInfo !== null
                isExplicitlyCompliant = compliantInfo !== null
                hasEvaluation = isNonCompliant || isExplicitlyCompliant
              }
              const isConsentLetter = document.documentType === "CONSENT_LETTER"
              const canReviewConsent =
                mode === "admin" &&
                isConsentLetter &&
                isUploaded &&
                applicationStatus === "OVERLAP_DETECTED_PENDING_CONSENT"

              return (
                <div
                  key={document.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isNonCompliant
                      ? "bg-red-50 border-red-300"
                      : isExplicitlyCompliant
                      ? "bg-green-50 border-green-300"
                      : isUploaded
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        isNonCompliant
                          ? "bg-red-100"
                          : isExplicitlyCompliant
                          ? "bg-green-100"
                          : isUploaded
                          ? "bg-yellow-100"
                          : "bg-gray-200"
                      }`}>
                        <File
                          className={`h-5 w-5 ${
                            isNonCompliant
                              ? "text-red-700"
                              : isExplicitlyCompliant
                              ? "text-green-700"
                              : isUploaded
                              ? "text-yellow-700"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          {label}
                          {isNonCompliant ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] uppercase">
                              Non-compliant
                            </Badge>
                          ) : isExplicitlyCompliant ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px] uppercase">
                              Compliant
                            </Badge>
                          ) : isUploaded ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] uppercase">
                              Pending review
                            </Badge>
                          ) : null}
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
                      {isNonCompliant ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : isExplicitlyCompliant ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : isUploaded ? (
                        <Loader2 className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDocument(document)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document.id, isOtherDocument)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>

                      {/* Admin-only actions for consent letters in overlap workflow */}
                      {canReviewConsent && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={reviewingConsentId === document.id}
                            onClick={() => handleConsentDecision(document, "ACCEPT")}
                          >
                            {reviewingConsentId === document.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={reviewingConsentId === document.id}
                            onClick={() => handleConsentDecision(document, "REJECT")}
                          >
                            {reviewingConsentId === document.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Only show Replace button for non-compliant documents (applicant side) */}
                      {canEdit && isNonCompliant && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingDocumentId(
                              editingDocumentId === document.id ? null : document.id
                            )
                          }
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Replace
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Show admin remarks for non-compliant documents */}
                  {isNonCompliant && nonCompliantInfo?.remarks && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">Admin Remarks:</p>
                          <p className="text-sm text-red-700 mt-1">{nonCompliantInfo.remarks}</p>
                          {nonCompliantInfo.checkedBy && (
                            <p className="text-xs text-red-600 mt-2">— Reviewed by {nonCompliantInfo.checkedBy}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {canEdit && isNonCompliant && editingDocumentId === document.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <DocumentUpload
                        applicationId={applicationId}
                        documentType={document.documentType}
                        documentName={
                          DOCUMENT_LABELS[document.documentType] || document.documentType
                        }
                        onUploadSuccess={() => {
                          setEditingDocumentId(null)
                          if (onRefresh) {
                            onRefresh()
                          }
                        }}
                        existingDocument={{
                          id: document.id,
                          fileName: document.fileName,
                          fileUrl: document.fileUrl,
                          version: document.version,
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View document</DialogTitle>
            <DialogDescription>
              {previewDocument && (
                <span>
                  {DOCUMENT_LABELS[previewDocument.documentType] || previewDocument.documentType}
                  {" "}- <span className="font-semibold">{previewDocument.fileName}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {previewDocument && (
            <div className="mt-2 border rounded-md overflow-hidden">
              <iframe
                src={previewDocument._isOtherDocument
                  ? `/api/otherDocuments/${previewDocument.id}/download?inline=1`
                  : `/api/documents/${previewDocument.id}?inline=1`}
                className="w-full h-[70vh]"
              />
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPreviewDocument(null)}>
              Close
            </Button>
            {previewDocument && (
              <Button variant="outline" onClick={() => handleDownload(previewDocument.id, previewDocument._isOtherDocument)}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
