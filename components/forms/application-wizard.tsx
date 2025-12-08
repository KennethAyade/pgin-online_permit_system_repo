"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StepPermitType } from "./step-permit-type"
import { StepProjectCoordinates } from "./step-project-coordinates"
import { StepProjectInfo } from "./step-project-info"
import { StepProjectDetails } from "./step-project-details"
import { StepAcceptanceDocs } from "./step-acceptance-docs"
import { StepOtherRequirements } from "./step-other-requirements"
import { StepReview } from "./step-review"
import { APPLICATION_STEPS, TOTAL_WIZARD_STEPS } from "@/lib/constants"
import { ChevronLeft, ChevronRight, Save, Send, Clock, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApplicationWizardProps {
  applicationId?: string
  initialData?: any
}

export function ApplicationWizard({ applicationId, initialData }: ApplicationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialData?.currentStep || 1)
  const [formData, setFormData] = useState<any>(initialData || {})
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [isSubmittingCoordinates, setIsSubmittingCoordinates] = useState(false)
  const [applicationIdState, setApplicationIdState] = useState<string | undefined>(applicationId)
  const [applicationStatus, setApplicationStatus] = useState<string>(initialData?.status || "DRAFT")

  const totalSteps = TOTAL_WIZARD_STEPS
  const progress = (currentStep / totalSteps) * 100

  // Check if coordinates are approved (can proceed beyond Step 2)
  //
  // Cases:
  // - COORDINATE_AUTO_APPROVED: no overlap, auto-approved.
  // - DRAFT + coordinateApprovedAt: legacy path where coordinates were approved while still DRAFT.
  // - OVERLAP_DETECTED_PENDING_CONSENT + consentLetterUrl: overlap detected, but applicant has uploaded
  //   the required consent letter, so they can proceed while admin reviews asynchronously.
  const coordinatesApproved =
    applicationStatus === "COORDINATE_AUTO_APPROVED" ||
    (applicationStatus === "DRAFT" && formData.coordinateApprovedAt) ||
    (applicationStatus === "OVERLAP_DETECTED_PENDING_CONSENT" && !!formData.consentLetterUrl)

  // Coordinates are fully approved only when the admin has set coordinateApprovedAt
  const coordinatesFullyApproved = !!formData.coordinateApprovedAt

  const coordinatesPending = applicationStatus === "PENDING_COORDINATE_APPROVAL" // Deprecated
  const coordinatesOverlapDetected = applicationStatus === "OVERLAP_DETECTED_PENDING_CONSENT"
  const coordinatesRejected = applicationStatus === "COORDINATE_REVISION_REQUIRED"

  // Step 6 lock state: Other Requirements remain a future phase while application is in early statuses
  const isStep6Locked =
    currentStep === APPLICATION_STEPS.OTHER_REQUIREMENTS &&
    [
      "DRAFT",
      "OVERLAP_DETECTED_PENDING_CONSENT",
      "COORDINATE_AUTO_APPROVED",
      "PENDING_COORDINATE_APPROVAL",
      "COORDINATE_REVISION_REQUIRED",
    ].includes(applicationStatus)

  // Initialize form data from initialData when it changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      if (initialData.currentStep) {
        setCurrentStep(initialData.currentStep)
      }
      if (initialData.status) {
        setApplicationStatus(initialData.status)
      }
    }
  }, [initialData])

  // Auto-save draft when form data changes (only for steps after application creation)
  useEffect(() => {
    // Only auto-save for editable statuses
    const editableStatuses = [
      "DRAFT",
      "RETURNED",
      "FOR_ACTION",
      "COORDINATE_REVISION_REQUIRED",
      "OVERLAP_DETECTED_PENDING_CONSENT",
    ]
    const canAutoSave = !applicationStatus || editableStatuses.includes(applicationStatus)

    if (applicationIdState && currentStep >= APPLICATION_STEPS.PROJECT_COORDINATES && canAutoSave) {
      const timeoutId = setTimeout(() => {
        saveDraft()
      }, 2000) // Debounce: save 2 seconds after last change

      return () => clearTimeout(timeoutId)
    }
  }, [formData, currentStep, applicationIdState, applicationStatus])

  const saveDraft = async () => {
    if (!applicationIdState) return

    setIsSaving(true)
    setShowSaved(false)
    try {
      await fetch(`/api/applications/${applicationIdState}/draft`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          currentStep,
        }),
      })

      // Show "Saved" indicator for 2 seconds after save completes
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitCoordinates = async () => {
    if (!applicationIdState || !formData.projectCoordinates) {
      alert("Please enter all coordinate points before submitting")
      return
    }

    // Validate all points have values
    const coords = formData.projectCoordinates
    // Normalize to array format
    const coordsArray = Array.isArray(coords) ? coords : []

    // Validate minimum 3 points
    if (coordsArray.length < 3) {
      alert("Please enter at least 3 coordinate points")
      return
    }

    // Validate each point has valid lat/lng
    for (let i = 0; i < coordsArray.length; i++) {
      const point = coordsArray[i]
      if (!point?.lat || !point?.lng || point.lat === 0 || point.lng === 0) {
        alert(`Please enter valid inputs for Point ${i + 1}`)
        return
      }
    }

    setIsSubmittingCoordinates(true)
    try {
      const response = await fetch(`/api/applications/${applicationIdState}/submit-coordinates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectCoordinates: formData.projectCoordinates,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Failed to submit coordinates")
        return
      }

      // Update local status and form data
      setApplicationStatus(result.status)
      setFormData({
        ...formData,
        coordinateAutoApproved: result.autoApproved,
        coordinateApprovedAt: result.application?.coordinateApprovedAt,
        overlappingProjectIds: result.overlappingProjects?.map((p: any) => p.id),
      })

      // Show appropriate message based on result
      if (result.autoApproved) {
        alert("✓ Coordinates auto-approved! No overlap detected. You can continue with your application.")
        // Auto-advance to next step
        setCurrentStep(currentStep + 1)
      } else if (result.overlappingProjects && result.overlappingProjects.length > 0) {
        alert(`⚠ Overlap detected with ${result.overlappingProjects.length} existing project(s). Please upload a consent letter to proceed.`)
        // Stay on current step to upload consent
      } else {
        alert("Coordinates submitted for review! You can continue with your application.")
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error("Error submitting coordinates:", error)
      alert("An error occurred while submitting coordinates")
    } finally {
      setIsSubmittingCoordinates(false)
    }
  }

  const handleNext = async () => {
    // Step 1: Require permit type
    if (currentStep === APPLICATION_STEPS.PERMIT_TYPE && !formData.permitType) {
      return
    }

    // Step 2: Allow progression after coordinate submission
    // Admin approval happens asynchronously and doesn't block user

    // Create application after Step 1 (PERMIT_TYPE) - now creates at step 1 to allow coordinate saving
    if (currentStep === APPLICATION_STEPS.PERMIT_TYPE && !applicationIdState) {
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permitType: formData.permitType,
            currentStep: APPLICATION_STEPS.PROJECT_COORDINATES,
          }),
        })

        const result = await response.json()
        if (result.application) {
          setApplicationIdState(result.application.id)
        }
      } catch (error) {
        console.error("Error creating application:", error)
        return
      }
    } else if (applicationIdState) {
      await saveDraft()
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateRequiredFields = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Check required project information
    if (!formData.projectName?.trim()) {
      errors.push("Project Name is required")
    }
    if (!formData.projectArea) {
      errors.push("Project Area is required")
    }
    if (!formData.footprintArea) {
      errors.push("Footprint Area is required")
    }
    if (!formData.numEmployees) {
      errors.push("Number of Employees is required")
    }
    if (!formData.projectCost) {
      errors.push("Project Cost is required")
    }

    // Check coordinates are approved (status-aware messaging)
    if (!formData.coordinateApprovedAt) {
      let coordinateMessage = "Project Coordinates must be approved before submission"

      if (applicationStatus === "PENDING_COORDINATE_APPROVAL") {
        coordinateMessage = "Project Coordinates are still under admin review"
      } else if (applicationStatus === "OVERLAP_DETECTED_PENDING_CONSENT") {
        coordinateMessage = "Project Coordinates cannot be approved until all required consents are verified by admin"
      }

      errors.push(coordinateMessage)
    }

    return { isValid: errors.length === 0, errors }
  }

  const handleSubmit = async () => {
    if (!applicationIdState) return

    // Hard guard: coordinates must be fully approved by admin before submission
    if (!coordinatesFullyApproved) {
      alert(
        "Your project coordinates have not yet been approved by the admin.\n\n" +
        "Please wait for coordinate approval before submitting your application."
      )
      return
    }

    // Validate required fields before submission
    const validation = validateRequiredFields()
    if (!validation.isValid) {
      alert(
        "Please complete the following required fields before submitting:\n\n" +
        validation.errors.map(err => `• ${err}`).join("\n")
      )
      return
    }

    try {
      const response = await fetch(`/api/applications/${applicationIdState}/submit`, {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Failed to submit application")
        return
      }

      router.push(`/applications/${applicationIdState}`)
    } catch (error) {
      console.error("Error submitting application:", error)
      alert("An error occurred while submitting the application")
    }
  }

  const updateFormData = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case APPLICATION_STEPS.PERMIT_TYPE:
        return (
          <StepPermitType
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.PROJECT_COORDINATES:
        return (
          <StepProjectCoordinates
            applicationId={applicationIdState}
            data={formData}
            onUpdate={updateFormData}
            applicationStatus={applicationStatus}
            coordinateReviewRemarks={formData.coordinateReviewRemarks}
            isReadOnly={coordinatesPending}
          />
        )
      case APPLICATION_STEPS.PROJECT_INFO:
        return (
          <StepProjectInfo
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.PROJECT_DETAILS:
        return (
          <StepProjectDetails
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.ACCEPTANCE_DOCS:
        return (
          <StepAcceptanceDocs
            applicationId={applicationIdState}
            permitType={formData.permitType}
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.OTHER_REQUIREMENTS:
        return (
          <StepOtherRequirements
            applicationId={applicationIdState}
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.REVIEW:
        return (
          <StepReview
            applicationId={applicationIdState}
            data={formData}
            onSubmit={handleSubmit}
          />
        )
      default:
        return null
    }
  }

  // Determine if we should show coordinate submit button
  const showCoordinateSubmitButton = currentStep === APPLICATION_STEPS.PROJECT_COORDINATES &&
    applicationIdState &&
    !coordinatesApproved &&
    !coordinatesPending

  // Determine if Next button should be disabled
  const isNextDisabled = () => {
    if (currentStep === APPLICATION_STEPS.PERMIT_TYPE && !formData.permitType) {
      return true
    }
    if (currentStep === APPLICATION_STEPS.PROJECT_COORDINATES && !coordinatesApproved) {
      return true
    }

    // Prevent leaving Step 6 (Other Requirements) while application is still in early/pre-acceptance statuses
    if (isStep6Locked) {
      return true
    }

    return false
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">New Permit Application</CardTitle>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Save className="h-4 w-4 animate-pulse" />
                <span className="hidden sm:inline">Saving draft...</span>
                <span className="sm:hidden">Saving...</span>
              </div>
            )}
            {!isSaving && showSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Save className="h-4 w-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-6">
          {/* Coordinate Approval Status Banner */}
          {currentStep > APPLICATION_STEPS.PROJECT_COORDINATES && coordinatesPending && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-700" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Waiting for Coordinate Approval</strong>
                <br />
                Your project coordinates are being reviewed. You cannot proceed until they are approved.
              </AlertDescription>
            </Alert>
          )}

          {currentStep === APPLICATION_STEPS.REVIEW && !coordinatesFullyApproved && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-900 text-sm">
                <strong>Coordinate approval pending.</strong>
                <br />
                Your project coordinates have not yet been approved by the admin. You will receive a notification once they are approved, and you will not be able to submit your application until then.
              </AlertDescription>
            </Alert>
          )}

          {currentStep > APPLICATION_STEPS.PROJECT_COORDINATES && coordinatesRejected && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-700" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Coordinate Revision Required</strong>
                <br />
                Please go back to Step 2 to revise your coordinates based on the admin's feedback.
              </AlertDescription>
            </Alert>
          )}

          {renderStep()}

          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto border-gray-300"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Submit Coordinates Button (Step 2 only, when not yet approved/pending) */}
              {showCoordinateSubmitButton && (
                <Button
                  onClick={handleSubmitCoordinates}
                  disabled={isSubmittingCoordinates}
                  className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingCoordinates ? "Submitting..." : "Submit for Review"}
                </Button>
              )}

              {/* Next Button / Submit for Review Button */}
              {currentStep < totalSteps && (
                <Button
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                  className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50"
                >
                  {currentStep === APPLICATION_STEPS.ACCEPTANCE_DOCS ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}

              {/* Submit Application Button (Final Step) */}
              {currentStep === totalSteps && (
                <Button
                  onClick={handleSubmit}
                  disabled={!applicationIdState || !coordinatesFullyApproved}
                  className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white disabled:opacity-50"
                >
                  Submit Application
                </Button>
              )}

              {/* Direct navigation option when Step 6 is locked */}
              {isStep6Locked && applicationIdState && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/applications/${applicationIdState}`)}
                  className="w-full sm:w-auto border-gray-300"
                >
                  Go to Application Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
