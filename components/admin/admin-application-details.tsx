"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/application/status-badge"
import { StatusTimeline } from "@/components/application/status-timeline"
import { DocumentList } from "@/components/application/document-list"
import { DecisionModal } from "./decision-modal"
import { EvaluationChecklist } from "./evaluation-checklist"
import { AdminAcceptanceRequirements } from "./admin-acceptance-requirements"
import { AdminOtherDocuments } from "./admin-other-documents"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, History, ClipboardCheck, User } from "lucide-react"

interface AdminApplicationDetailsProps {
  application: any
  onUpdate?: () => void
}

export function AdminApplicationDetails({ application, onUpdate }: AdminApplicationDetailsProps) {
  const canEvaluate = ["SUBMITTED", "UNDER_REVIEW", "INITIAL_CHECK", "TECHNICAL_REVIEW"].includes(application.status)
  const canApprove = application.status === "FOR_FINAL_APPROVAL"
  const canReturn = ["SUBMITTED", "UNDER_REVIEW", "INITIAL_CHECK", "TECHNICAL_REVIEW"].includes(application.status)

  return (
    <div className="space-y-6">
      {/* Application Info Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Application Information</CardTitle>
            <div className="flex gap-2">
              {canEvaluate && (
                <EvaluationChecklist
                  applicationId={application.id}
                  permitType={application.permitType}
                  evaluationType={
                    application.status === "SUBMITTED" || application.status === "UNDER_REVIEW"
                      ? "INITIAL_CHECK"
                      : application.status === "TECHNICAL_REVIEW"
                      ? "TECHNICAL_REVIEW"
                      : "INITIAL_CHECK"
                  }
                  onSuccess={onUpdate}
                />
              )}
              {canApprove && (
                <DecisionModal
                  applicationId={application.id}
                  action="approve"
                  onSuccess={onUpdate}
                />
              )}
              {canReturn && (
                <>
                  <DecisionModal
                    applicationId={application.id}
                    action="return"
                    onSuccess={onUpdate}
                  />
                  <DecisionModal
                    applicationId={application.id}
                    action="reject"
                    onSuccess={onUpdate}
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Applicant Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-700" />
              <h3 className="font-semibold text-gray-900">Applicant Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Name</p>
                <p className="text-sm text-gray-900">{application.user?.fullName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm text-gray-900">{application.user?.email || "N/A"}</p>
              </div>
              {application.user?.mobileNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Mobile</p>
                  <p className="text-sm text-gray-900">{application.user.mobileNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
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

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="acceptance-requirements" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Acceptance Requirements
          </TabsTrigger>
          <TabsTrigger value="other-documents" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Other Documents
          </TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            <History className="h-4 w-4 mr-2" />
            Status History
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Evaluations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentList
            documents={application.documents || []}
            applicationId={application.id}
            applicationStatus={application.status}
            evaluations={application.evaluations || []}
          />
        </TabsContent>

        <TabsContent value="acceptance-requirements">
          <AdminAcceptanceRequirements applicationId={application.id} onUpdated={onUpdate} />
        </TabsContent>

        <TabsContent value="other-documents">
          <AdminOtherDocuments applicationId={application.id} onUpdated={onUpdate} />
        </TabsContent>

        <TabsContent value="status">
          <StatusTimeline statusHistory={application.statusHistory || []} />
        </TabsContent>

        <TabsContent value="evaluations">
          <div className="space-y-4">
            {application.evaluations && application.evaluations.length > 0 ? (
              application.evaluations.map((evaluation: any) => (
                <Card key={evaluation.id} className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {evaluation.evaluationType.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Evaluated by: <span className="font-medium text-gray-900">{evaluation.evaluator?.fullName || "N/A"}</span>
                    </p>
                    <div className="space-y-2">
                      {evaluation.checklistItems?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm flex-1">{item.itemName}</span>
                          {item.isCompliant ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">Compliant</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-300">Non-compliant</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    {evaluation.summary && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Summary</p>
                        <p className="text-sm text-gray-900">{evaluation.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="py-12 text-center text-gray-500">
                  <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No evaluations yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
