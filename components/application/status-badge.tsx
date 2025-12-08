import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

// Mapping from internal ApplicationStatus enum values to user-friendly labels and colors
// This prevents raw enum strings like "ACCEPTANCE_IN_PROGRESS" or "OVERLAP_DETECTED_PENDING_CONSENT"
// from leaking into the UI.
const statusConfig: Record<string, { label: string; className: string }> = {
  // Draft / pre-submission states
  DRAFT: { label: "Pending Submission", className: "bg-gray-100 text-gray-800 border-gray-300" },
  COORDINATE_AUTO_APPROVED: {
    label: "Coordinates Approved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  PENDING_COORDINATE_APPROVAL: {
    label: "Coordinates Under Review",
    className: "bg-sky-100 text-sky-800 border-sky-300",
  },
  COORDINATE_REVISION_REQUIRED: {
    label: "Coordinate Revision Required",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  OVERLAP_DETECTED_PENDING_CONSENT: {
    label: "Overlap – Consent Required",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },

  // Main submission / evaluation pipeline
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  ACCEPTANCE_IN_PROGRESS: {
    label: "Acceptance In Progress",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  PENDING_OTHER_DOCUMENTS: {
    label: "Pending Other Documents",
    className: "bg-teal-100 text-teal-800 border-teal-300",
  },
  PENDING_OTHER_DOCS_REVIEW: {
    label: "Other Documents In Review",
    className: "bg-teal-100 text-teal-800 border-teal-300",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  INITIAL_CHECK: {
    label: "Initial Check",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  TECHNICAL_REVIEW: {
    label: "Technical Review",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  FOR_FINAL_APPROVAL: {
    label: "For Final Approval",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  FOR_ACTION: {
    label: "For Applicant Action",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },

  // Terminal / decision states
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  VOIDED: {
    label: "Voided",
    className: "bg-gray-200 text-gray-700 border-gray-300",
  },

  // Payment / permit issuance
  PAYMENT_PENDING: {
    label: "Payment Pending",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  PERMIT_ISSUED: {
    label: "Permit Issued",
    className: "bg-green-100 text-green-800 border-green-300",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config =
    statusConfig[status] || ({
      label: status.replace(/_/g, " "),
      className: "bg-gray-100 text-gray-800 border-gray-300",
    } as const)

  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}
