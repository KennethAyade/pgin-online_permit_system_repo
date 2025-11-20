"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApplicationWizard } from "@/components/forms/application-wizard"
import { Loader2 } from "lucide-react"

export default function NewApplicationPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("id")
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(!!applicationId)

  useEffect(() => {
    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      const result = await response.json()

      if (result.application) {
        setInitialData(result.application)
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <ApplicationWizard
        applicationId={applicationId || undefined}
        initialData={initialData}
      />
    </div>
  )
}

