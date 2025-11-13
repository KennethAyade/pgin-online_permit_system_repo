import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800 border-gray-300" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-800 border-blue-300" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  INITIAL_CHECK: { label: "Initial Check", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  TECHNICAL_REVIEW: { label: "Technical Review", className: "bg-purple-100 text-purple-800 border-purple-300" },
  FOR_FINAL_APPROVAL: { label: "For Final Approval", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  FOR_ACTION: { label: "For Action", className: "bg-orange-100 text-orange-800 border-orange-300" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 border-green-300" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-300" },
  RETURNED: { label: "Returned", className: "bg-red-100 text-red-800 border-red-300" },
  PAYMENT_PENDING: { label: "Payment Pending", className: "bg-amber-100 text-amber-800 border-amber-300" },
  PERMIT_ISSUED: { label: "Permit Issued", className: "bg-green-100 text-green-800 border-green-300" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800 border-gray-300" }

  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}
