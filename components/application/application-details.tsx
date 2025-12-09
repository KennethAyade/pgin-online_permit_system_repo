"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { StatusTimeline } from "./status-timeline"
import { DocumentList } from "./document-list"
import { CommentsSection } from "./comments-section"
import { AcceptanceRequirementsSection } from "./acceptance-requirements-section"
import { OtherDocumentsSection } from "./other-documents-section"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, MessageSquare, History, ClipboardCheck, CheckSquare, Folder } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApplicationDetailsProps {
  application: any
  onUpdate?: () => void
}

export function ApplicationDetails({ application, onUpdate }: ApplicationDetailsProps) {
  // Check if Other Documents tab should be visible
  const showOtherDocuments = application.status === "PENDING_OTHER_DOCUMENTS" ||
                             application.status === "PENDING_OTHER_DOCS_REVIEW" ||
                             application.status === "UNDER_REVIEW" ||
                             application.status === "INITIAL_CHECK" ||
                             application.status === "TECHNICAL_REVIEW" ||
                             application.status === "FOR_FINAL_APPROVAL" ||
                             application.status === "APPROVED" ||
                             application.status === "REJECTED"

  // Check if user can resubmit documents (when returned for revision)
  const canResubmit = application.status === "RETURNED"

  // Allow continuing the wizard only for truly early-phase drafts where
  // acceptance requirements have not yet been initialized. Once
  // acceptanceRequirementsStartedAt is set, the wizard should be
  // considered "sealed" and users should work from Application Details
  // instead of re-running Steps 1–5.
  const canContinue =
    (application.status === "DRAFT" ||
      application.status === "OVERLAP_DETECTED_PENDING_CONSENT" ||
      application.status === "COORDINATE_REVISION_REQUIRED") &&
    !application.acceptanceRequirementsStartedAt

  const inAcceptancePhase = !!application.acceptanceRequirementsStartedAt

  return (
    <Tabs defaultValue="acceptance" className="space-y-4">
      {inAcceptancePhase && (
        <Alert className="border-indigo-200 bg-indigo-50">
          <AlertDescription className="text-indigo-900 text-sm">
            <strong>Acceptance Requirements phase.</strong>
            <br />
            Your application has moved into the Acceptance Requirements phase. Manage your
            uploaded documents and any revision requests from this page. The original wizard
            steps (1–5) are now locked.
          </AlertDescription>
        </Alert>
      )}
      <TabsList className="bg-white border border-gray-200 p-1 w-full overflow-x-auto flex-nowrap justify-start">
        <TabsTrigger value="acceptance" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
          <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">Acceptance Requirements</span>
          <span className="lg:hidden">Accept.</span>
        </TabsTrigger>
        {showOtherDocuments && (
          <TabsTrigger value="other-documents" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden lg:inline">Other Documents</span>
            <span className="lg:hidden">Other</span>
          </TabsTrigger>
        )}
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

      <TabsContent value="acceptance">
        <AcceptanceRequirementsSection
          applicationId={application.id}
          applicationNo={application.applicationNo}
          projectName={application.projectName}
          permitType={application.permitType}
        />
      </TabsContent>

      {showOtherDocuments && (
        <TabsContent value="other-documents">
          <OtherDocumentsSection
            applicationId={application.id}
            applicationNo={application.applicationNo}
            projectName={application.projectName}
          />
        </TabsContent>
      )}

      <TabsContent value="documents">
        <DocumentList
          documents={application.documents || []}
          otherDocuments={application.otherDocuments || []}
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
