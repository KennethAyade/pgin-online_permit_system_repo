"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, AlertTriangle, FileText, Info } from "lucide-react"
import { DOCUMENT_REQUIREMENTS } from "@/lib/constants"

interface StepReviewProps {
  applicationId?: string
  data: any
  onSubmit: () => void
}

const DOCUMENT_LABELS: Record<string, string> = {
  APPLICATION_FORM: "Application Form",
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

export function StepReview({ applicationId, data, onSubmit }: StepReviewProps) {
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [missingDocs, setMissingDocs] = useState<string[]>([])

  useEffect(() => {
    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      const result = await response.json()
      if (result.application) {
        setApplication(result.application)
        checkCompleteness(result.application)
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkCompleteness = (app: any) => {
    const requirements = app.permitType === "ISAG"
      ? DOCUMENT_REQUIREMENTS.ISAG.mandatory
      : DOCUMENT_REQUIREMENTS.CSAG.mandatory

    const uploadedDocTypes = app.documents?.map((doc: any) => doc.documentType) || []
    const missing = requirements.filter(
      (docType) => !uploadedDocTypes.includes(docType)
    )
    setMissingDocs(missing)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    )
  }

  if (!application) {
    return (
      <Alert variant="destructive" className="border-red-300 bg-red-50">
        <AlertDescription className="text-red-800">Application not found</AlertDescription>
      </Alert>
    )
  }

  const isComplete = missingDocs.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Review Application</h3>
        <p className="text-sm text-gray-600">
          Please review all information before submitting your application
        </p>
      </div>

      {!isComplete && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800">
            <strong>Missing required documents:</strong> {missingDocs.map(doc => DOCUMENT_LABELS[doc] || doc).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Application Summary */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Application Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Application Number</p>
              <p className="text-sm font-semibold text-gray-900">{application.applicationNo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Permit Type</p>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">{application.permitType}</Badge>
            </div>
          </div>
          
          {application.projectName && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Name</p>
              <p className="text-sm text-gray-900">{application.projectName}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            {application.projectArea && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Area</p>
                <p className="text-sm text-gray-900">{application.projectArea.toString()} hectares</p>
              </div>
            )}
            {application.footprintArea && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Footprint Area</p>
                <p className="text-sm text-gray-900">{application.footprintArea.toString()} hectares</p>
              </div>
            )}
            {application.numEmployees && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Employees</p>
                <p className="text-sm text-gray-900">{application.numEmployees}</p>
              </div>
            )}
            {application.projectCost && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Cost</p>
                <p className="text-sm text-gray-900">PHP {application.projectCost.toString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {DOCUMENT_LABELS[doc.documentType] || doc.documentType}
                    </p>
                    <p className="text-xs text-gray-500">{doc.fileName}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-300">v{doc.version}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Submission Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Important:</strong> By submitting this application, you confirm that all information provided is accurate and all documents are authentic. False information may result in application rejection.
        </AlertDescription>
      </Alert>
    </div>
  )
}
