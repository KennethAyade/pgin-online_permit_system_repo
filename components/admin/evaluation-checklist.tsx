"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { DOCUMENT_REQUIREMENTS } from "@/lib/constants"

interface EvaluationChecklistProps {
  applicationId: string
  permitType: "ISAG" | "CSAG"
  evaluationType: "INITIAL_CHECK" | "TECHNICAL_REVIEW" | "FINAL_APPROVAL"
  /** Which documents to show in the checklist: "acceptance", "other", or "all" (default) */
  mode?: "acceptance" | "other" | "all"
  onSuccess?: () => void
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
}

const OTHER_DOCUMENT_LABELS: Record<string, string> = {
  AREA_STATUS_CLEARANCE_CENRO: "Area Status Clearance (CENRO)",
  AREA_STATUS_CLEARANCE_MGB: "Area Status Clearance (MGB)",
  CERTIFICATE_POSTING_BARANGAY: "Certificate of Posting (Barangay)",
  CERTIFICATE_POSTING_MUNICIPAL: "Certificate of Posting (Municipal)",
  CERTIFICATE_POSTING_PROVINCIAL: "Certificate of Posting (Provincial)",
  CERTIFICATE_POSTING_CENRO: "Certificate of Posting (CENRO)",
  CERTIFICATE_POSTING_PENRO: "Certificate of Posting (PENRO)",
  CERTIFICATE_POSTING_MGB: "Certificate of Posting (MGB)",
  ECC: "Environmental Compliance Certificate (ECC)",
  SANGGUNIAN_ENDORSEMENT_BARANGAY: "Sanggunian Endorsement (Barangay)",
  SANGGUNIAN_ENDORSEMENT_MUNICIPAL: "Sanggunian Endorsement (Municipal)",
  SANGGUNIAN_ENDORSEMENT_PROVINCIAL: "Sanggunian Endorsement (Provincial)",
  FIELD_VERIFICATION_REPORT: "Field Verification Report",
  SURETY_BOND: "Surety Bond",
}

export function EvaluationChecklist({
  applicationId,
  permitType,
  evaluationType,
  mode = "all",
  onSuccess,
}: EvaluationChecklistProps) {
  const [open, setOpen] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, { isComplete: boolean; isCompliant?: boolean; remarks?: string; category: string }>>({})
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [acceptanceRequirements, setAcceptanceRequirements] = useState<any[]>([])
  const [otherDocuments, setOtherDocuments] = useState<any[]>([])

  // Get acceptance requirements based on permit type
  const acceptanceReqs = permitType === "ISAG"
    ? DOCUMENT_REQUIREMENTS.ISAG.acceptance
    : DOCUMENT_REQUIREMENTS.CSAG.acceptance

  // Get other documents requirements based on permit type
  const otherReqs = permitType === "ISAG"
    ? DOCUMENT_REQUIREMENTS.ISAG.other
    : DOCUMENT_REQUIREMENTS.CSAG.other

  // Determine which requirements to show based on mode
  const requirements = mode === "acceptance"
    ? acceptanceReqs
    : mode === "other"
    ? otherReqs
    : [...acceptanceReqs, ...otherReqs]

  // Combined labels for lookup
  const allLabels = { ...DOCUMENT_LABELS, ...OTHER_DOCUMENT_LABELS }

  // Determine category based on document type
  const getCategory = (docType: string): "DOCUMENT_VERIFICATION" | "OTHER_REQUIREMENTS" => {
    return (acceptanceReqs as readonly string[]).includes(docType) ? "DOCUMENT_VERIFICATION" : "OTHER_REQUIREMENTS"
  }

  // Fetch acceptance requirements and other documents when dialog opens
  useEffect(() => {
    if (open && applicationId) {
      fetchRequirementsData()
    }
  }, [open, applicationId])

  const fetchRequirementsData = async () => {
    try {
      // Fetch both acceptance requirements and other documents in parallel
      const [acceptanceRes, otherDocsRes] = await Promise.all([
        fetch(`/api/acceptanceRequirements/${applicationId}`),
        fetch(`/api/admin/otherDocuments/${applicationId}`)
      ])

      const prefilledChecklist: Record<string, { isComplete: boolean; isCompliant?: boolean; remarks?: string; category: string }> = {}

      // Process acceptance requirements
      if (acceptanceRes.ok) {
        const acceptanceData = await acceptanceRes.json()
        setAcceptanceRequirements(acceptanceData.requirements || [])

        // Pre-fill checklist for ACCEPTED requirements
        acceptanceData.requirements?.forEach((req: any) => {
          if (req.status === "ACCEPTED") {
            prefilledChecklist[req.requirementType] = {
              isComplete: true,
              isCompliant: req.isCompliant ?? undefined,
              remarks: req.adminRemarks || undefined,
              category: "DOCUMENT_VERIFICATION",
            }
          }
        })
      }

      // Process other documents
      if (otherDocsRes.ok) {
        const otherDocsData = await otherDocsRes.json()
        setOtherDocuments(otherDocsData.documents || [])

        // Pre-fill checklist for ACCEPTED other documents
        otherDocsData.documents?.forEach((doc: any) => {
          if (doc.status === "ACCEPTED") {
            prefilledChecklist[doc.documentType] = {
              isComplete: true,
              isCompliant: doc.isCompliant ?? undefined,
              remarks: doc.adminRemarks || undefined,
              category: "OTHER_REQUIREMENTS",
            }
          }
        })
      }

      setChecklist(prefilledChecklist)
    } catch (err) {
      console.error("Failed to fetch requirements data:", err)
    }
  }

  const handleSubmit = async () => {
    const checklistItems = requirements.map((docType, index) => ({
      itemNumber: index + 1,
      itemName: allLabels[docType] || docType,
      category: getCategory(docType),
      isComplete: checklist[docType]?.isComplete || false,
      isCompliant: checklist[docType]?.isCompliant,
      remarks: checklist[docType]?.remarks,
    }))

    const isCompliant = checklistItems.every((item) => item.isCompliant !== false)

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluationType,
          checklistItems,
          isCompliant,
          summary,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to submit evaluation")
        setLoading(false)
        return
      }

      setOpen(false)
      setChecklist({})
      setSummary("")
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setError("An error occurred")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 hover:bg-blue-50 hover:border-blue-300">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Evaluate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Evaluation Checklist - {evaluationType.replace(/_/g, ' ')}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Review and evaluate the application documents and requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show section headers when in "all" mode */}
          {mode === "all" && (
            <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
              Document Verification (Acceptance Requirements)
            </div>
          )}
          {requirements.map((docType, index) => {
            // Add section header for Other Requirements when in "all" mode
            const showOtherHeader = mode === "all" && index === acceptanceReqs.length
            const isOtherDocument = (otherReqs as readonly string[]).includes(docType)

            return (
              <div key={docType}>
                {showOtherHeader && (
                  <div className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4 mt-6">
                    Other Requirements
                  </div>
                )}
                <div className="border-2 border-gray-200 rounded-lg p-4 space-y-3 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isOtherDocument ? "text-green-600 bg-green-100" : "text-gray-500 bg-gray-100"}`}>#{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={checklist[docType]?.isComplete || false}
                          onCheckedChange={(checked) =>
                            setChecklist({
                              ...checklist,
                              [docType]: {
                                ...checklist[docType],
                                isComplete: checked === true,
                                category: getCategory(docType),
                              },
                            })
                          }
                        />
                        <Label className="font-medium text-gray-900 text-sm">
                          {allLabels[docType] || docType}
                        </Label>
                      </div>
                      {checklist[docType]?.isComplete && (
                        <div className="ml-6 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={checklist[docType]?.isCompliant === true}
                                onCheckedChange={(checked) =>
                                  setChecklist({
                                    ...checklist,
                                    [docType]: {
                                      ...checklist[docType],
                                      isCompliant: checked === true,
                                      category: getCategory(docType),
                                    },
                                  })
                                }
                              />
                              <Label className="text-sm text-green-700 font-medium">Compliant</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={checklist[docType]?.isCompliant === false}
                                onCheckedChange={(checked) =>
                                  setChecklist({
                                    ...checklist,
                                    [docType]: {
                                      ...checklist[docType],
                                      isCompliant: checked === true ? false : undefined,
                                      category: getCategory(docType),
                                    },
                                  })
                                }
                              />
                              <Label className="text-sm text-red-700 font-medium">Non-compliant</Label>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Remarks (optional)"
                            value={checklist[docType]?.remarks || ""}
                            onChange={(e) =>
                              setChecklist({
                                ...checklist,
                                [docType]: {
                                  ...checklist[docType],
                                  remarks: e.target.value,
                                  category: getCategory(docType),
                                },
                              })
                            }
                            rows={2}
                            className="text-sm border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Label htmlFor="summary" className="text-sm font-medium text-gray-700">
              Evaluation Summary
            </Label>
            <Textarea
              id="summary"
              placeholder="Provide an overall evaluation summary..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Evaluation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
