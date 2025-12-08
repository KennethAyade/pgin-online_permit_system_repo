"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Info, FileText, CheckCircle2 } from "lucide-react"

interface StepOtherRequirementsProps {
  applicationId?: string
  data: any
  onUpdate: (data: any) => void
}

const OTHER_REQUIREMENTS_LIST = [
  "Area Status & Clearance (CENRO)",
  "Area Status & Clearance (MGB Regional Office)",
  "Certificate of Posting (Barangay)",
  "Certificate of Posting (Municipal Government)",
  "Certificate of Posting (Provincial Government)",
  "Certificate of Posting (CENRO)",
  "Certificate of Posting (PENRO)",
  "Certificate of Posting (MGB Regional Office)",
  "Environmental Compliance Certificate (ECC)",
  "Sanggunian Endorsement (Barangay)",
  "Sanggunian Endorsement (Municipal)",
  "Sanggunian Endorsement (Provincial)",
  "Field Verification Report",
  "Surety Bond (₱20,000.00)",
]

export function StepOtherRequirements({
  applicationId,
  data,
  onUpdate,
}: StepOtherRequirementsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Other Requirements</h3>
        <p className="text-sm text-gray-600">
          These documents will be available for upload after your acceptance requirements are approved.
        </p>
      </div>

      {/* Lock Message */}
      <Alert className="border-amber-300 bg-amber-50">
        <Lock className="h-5 w-5 text-amber-700" />
        <AlertDescription className="text-amber-900">
          <div className="space-y-3">
            <p className="font-semibold">This section is currently locked</p>
            <p className="text-sm">
              After you submit your Acceptance Requirements in the wizard, they will be converted into individual items on your Application Details page. Once ALL acceptance requirements are approved there, this Other Requirements section will unlock and you will upload the additional documents from Application Details.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Workflow Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
        <h4 className="font-semibold text-blue-900 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Document Submission Workflow
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-full p-1 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Phase 1: Acceptance Requirements</p>
              <p className="text-xs text-blue-700 mt-1">
                Upload all acceptance requirements in Step 6 and submit your application. Admin will review each document.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-gray-200 rounded-full p-1 mt-0.5">
              <div className="h-4 w-4 flex items-center justify-center text-gray-600 text-xs font-bold">2</div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Phase 2: Other Documents (This Section)</p>
              <p className="text-xs text-blue-700 mt-1">
                After ALL acceptance requirements are approved, you'll receive a notification and can upload these additional documents from your application page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview of Other Requirements */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Documents You'll Need to Upload Later:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OTHER_REQUIREMENTS_LIST.map((requirement, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
              <FileText className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>{requirement}</span>
            </div>
          ))}
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Note:</strong> These documents are part of a later phase. After your application and acceptance requirements have been reviewed and approved by the admin, you will be able to upload these Other Requirements from your Application Details page.
        </AlertDescription>
      </Alert>
    </div>
  )
}
