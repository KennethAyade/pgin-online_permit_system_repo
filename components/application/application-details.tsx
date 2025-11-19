"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { StatusTimeline } from "./status-timeline"
import { DocumentList } from "./document-list"
import { CommentsSection } from "./comments-section"
import { AcceptanceRequirementsSection } from "./acceptance-requirements-section"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, MessageSquare, History, ClipboardCheck, CheckSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApplicationDetailsProps {
  application: any
  onUpdate?: () => void
}

export function ApplicationDetails({ application, onUpdate }: ApplicationDetailsProps) {
  const canResubmit = application.status === "RETURNED" || application.status === "FOR_ACTION"
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const handleResubmit = async () => {
    try {
      setSubmitLoading(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      const response = await fetch(`/api/applications/${application.id}/submit`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.missingDocuments && Array.isArray(result.missingDocuments)) {
          setSubmitError(
            `Missing required documents: ${result.missingDocuments.join(", ")}`
          )
        } else {
          setSubmitError(result.error || "Failed to submit application")
        }
        return
      }

      if (onUpdate) {
        onUpdate()
      }
      setSubmitSuccess("Application submitted successfully")
    } catch (error) {
      console.error("Error submitting application:", error)
      setSubmitError("An error occurred while submitting the application")
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="bg-white border border-gray-200 p-1 w-full overflow-x-auto flex-nowrap justify-start">
        <TabsTrigger value="overview" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Overview</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="acceptance" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">Acceptance Requirements</span>
          <span className="lg:hidden">Accept.</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Documents</span>
          <span className="sm:hidden">Docs</span>
        </TabsTrigger>
        <TabsTrigger value="status" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Status History</span>
          <span className="sm:hidden">Status</span>
        </TabsTrigger>
        <TabsTrigger value="evaluations" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <ClipboardCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Evaluations</span>
          <span className="sm:hidden">Eval.</span>
        </TabsTrigger>
        <TabsTrigger value="comments" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Comments</span>
          <span className="sm:hidden">Comm.</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {submitError && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertDescription className="text-red-800">{submitError}</AlertDescription>
          </Alert>
        )}
        {submitSuccess && (
          <Alert className="border-green-300 bg-green-50">
            <AlertDescription className="text-green-800">{submitSuccess}</AlertDescription>
          </Alert>
        )}
        {canResubmit && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleResubmit}
              disabled={submitLoading}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Submitting..." : "Resubmit Application"}
            </button>
          </div>
        )}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900">Application Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      <TabsContent value="acceptance">
        <AcceptanceRequirementsSection
          applicationId={application.id}
          applicationNo={application.applicationNo}
          projectName={application.projectName}
          permitType={application.permitType}
          currentRequirementId={application.currentAcceptanceRequirementId}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentList
          documents={application.documents || []}
          applicationId={application.id}
          applicationStatus={application.status}
          canEdit={canResubmit}
          onRefresh={onUpdate}
          evaluations={application.evaluations || []}
        />
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
                    {evaluation.evaluationType.replace(/_/g, " ")}
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
