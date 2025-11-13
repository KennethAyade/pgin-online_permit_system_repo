"use client"

import { useState } from "react"
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

export function EvaluationChecklist({
  applicationId,
  permitType,
  evaluationType,
  onSuccess,
}: EvaluationChecklistProps) {
  const [open, setOpen] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, { isComplete: boolean; isCompliant?: boolean; remarks?: string }>>({})
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const requirements = permitType === "ISAG"
    ? DOCUMENT_REQUIREMENTS.ISAG.mandatory
    : DOCUMENT_REQUIREMENTS.CSAG.mandatory

  const handleSubmit = async () => {
    const checklistItems = requirements.map((docType, index) => ({
      itemNumber: index + 1,
      itemName: DOCUMENT_LABELS[docType] || docType,
      category: "DOCUMENT_VERIFICATION" as const,
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
          {requirements.map((docType, index) => (
            <div key={docType} className="border-2 border-gray-200 rounded-lg p-4 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">#{index + 1}</span>
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
                          },
                        })
                      }
                    />
                    <Label className="font-medium text-gray-900 text-sm">
                      {DOCUMENT_LABELS[docType] || docType}
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
          ))}

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
