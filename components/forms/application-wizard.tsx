"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StepPermitType } from "./step-permit-type"
import { StepProjectInfo } from "./step-project-info"
import { StepProponentInfo } from "./step-proponent-info"
import { StepProjectDetails } from "./step-project-details"
import { StepAcceptanceDocs } from "./step-acceptance-docs"
import { StepOtherRequirements } from "./step-other-requirements"
import { StepReview } from "./step-review"
import { APPLICATION_STEPS } from "@/lib/constants"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
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
  const [applicationIdState, setApplicationIdState] = useState<string | undefined>(applicationId)

  const totalSteps = 7
  const progress = (currentStep / totalSteps) * 100

  // Initialize form data from initialData when it changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      if (initialData.currentStep) {
        setCurrentStep(initialData.currentStep)
      }
    }
  }, [initialData])

  // Auto-save draft when form data changes
  useEffect(() => {
    if (applicationIdState && currentStep >= APPLICATION_STEPS.PROJECT_INFO) {
      const timeoutId = setTimeout(() => {
        saveDraft()
      }, 2000) // Debounce: save 2 seconds after last change

      return () => clearTimeout(timeoutId)
    }
  }, [formData, currentStep, applicationIdState])

  const saveDraft = async () => {
    if (!applicationIdState) return

    setIsSaving(true)
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
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === APPLICATION_STEPS.PERMIT_TYPE && !formData.permitType) {
      return
    }

    // Create application on first step if it doesn't exist
    if (currentStep === APPLICATION_STEPS.PERMIT_TYPE && !applicationIdState) {
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permitType: formData.permitType,
            currentStep: APPLICATION_STEPS.PROJECT_INFO,
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

  const handleSubmit = async () => {
    if (!applicationIdState) return

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
      case APPLICATION_STEPS.PROJECT_INFO:
        return (
          <StepProjectInfo
            data={formData}
            onUpdate={updateFormData}
          />
        )
      case APPLICATION_STEPS.PROPONENT_INFO:
        return (
          <StepProponentInfo
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

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!applicationIdState}
                className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
              >
                Submit Application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
