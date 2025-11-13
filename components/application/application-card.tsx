"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"
import { FileText, Calendar } from "lucide-react"

interface ApplicationCardProps {
  application: {
    id: string
    applicationNo: string
    permitType: string
    status: string
    projectName?: string
    createdAt: string
    submittedAt?: string
  }
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Link href={`/applications/${application.id}`}>
      <Card className="gov-card hover:shadow-lg transition-all cursor-pointer group border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {application.applicationNo}
                </span>
              </div>
              {application.projectName && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{application.projectName}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-gray-300">
                  {application.permitType}
                </Badge>
                <StatusBadge status={application.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
            <Calendar className="h-3 w-3" />
            <span>
              {application.submittedAt
                ? `Submitted: ${format(new Date(application.submittedAt), "MMM d, yyyy")}`
                : `Created: ${format(new Date(application.createdAt), "MMM d, yyyy")}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
