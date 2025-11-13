"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { StatusTimeline } from "./status-timeline"
import { DocumentList } from "./document-list"
import { CommentsSection } from "./comments-section"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, MessageSquare, History } from "lucide-react"

interface ApplicationDetailsProps {
  application: any
  onUpdate?: () => void
}

export function ApplicationDetails({ application, onUpdate }: ApplicationDetailsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-white border border-gray-200 p-1">
        <TabsTrigger value="overview" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
          <FileText className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="documents" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
          <FileText className="h-4 w-4 mr-2" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="status" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
          <History className="h-4 w-4 mr-2" />
          Status History
        </TabsTrigger>
        <TabsTrigger value="comments" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          Comments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900">Application Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Application Number</p>
                <p className="text-sm font-semibold text-gray-900">{application.applicationNo}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Permit Type</p>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">{application.permitType}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <StatusBadge status={application.status} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
                <p className="text-sm text-gray-700">
                  {format(new Date(application.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              {application.submittedAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                  <p className="text-sm text-gray-700">
                    {format(new Date(application.submittedAt), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              )}
            </div>

            {application.projectName && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Name</p>
                <p className="text-base text-gray-900">{application.projectName}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              {application.projectArea && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Area</p>
                  <p className="text-sm font-semibold text-gray-900">{application.projectArea.toString()} hectares</p>
                </div>
              )}
              {application.footprintArea && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Footprint Area</p>
                  <p className="text-sm font-semibold text-gray-900">{application.footprintArea.toString()} hectares</p>
                </div>
              )}
              {application.numEmployees && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Employees</p>
                  <p className="text-sm font-semibold text-gray-900">{application.numEmployees}</p>
                </div>
              )}
              {application.projectCost && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Cost</p>
                  <p className="text-sm font-semibold text-gray-900">PHP {application.projectCost.toString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <DocumentList
          documents={application.documents || []}
          applicationId={application.id}
          applicationStatus={application.status}
        />
      </TabsContent>

      <TabsContent value="status">
        <StatusTimeline statusHistory={application.statusHistory || []} />
      </TabsContent>

      <TabsContent value="comments">
        <CommentsSection
          applicationId={application.id}
          comments={application.comments || []}
          onUpdate={onUpdate}
        />
      </TabsContent>
    </Tabs>
  )
}
