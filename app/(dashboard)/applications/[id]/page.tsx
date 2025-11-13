"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ApplicationDetails } from "@/components/application/application-details"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchApplication()
    }
  }, [params.id])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`)
      const result = await response.json()

      if (result.application) {
        setApplication(result.application)
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Application not found</p>
        <Button onClick={() => router.push("/applications")} className="bg-blue-700 hover:bg-blue-800">
          Back to Applications
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold mb-1">Application Details</h1>
            <p className="text-blue-100">
              Application Number: {application.applicationNo}
            </p>
          </div>
        </div>
      </div>

      <ApplicationDetails application={application} onUpdate={fetchApplication} />
    </div>
  )
}
