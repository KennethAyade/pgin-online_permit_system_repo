"use client"

import { useEffect, useState } from "react"
import { ApplicationCard } from "@/components/application/application-card"
import { Loader2, AlertCircle, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export default function ForActionPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/applications?status=FOR_ACTION")
      const result = await response.json()

      if (result.applications) {
        // Also include RETURNED applications
        const returnedResponse = await fetch("/api/applications?status=RETURNED")
        const returnedResult = await returnedResponse.json()
        
        const allForAction = [
          ...result.applications,
          ...(returnedResult.applications || []),
        ]
        
        setApplications(allForAction)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">For Action</h1>
            <p className="text-sm sm:text-base text-orange-100">
              Applications requiring your attention
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <Alert className="max-w-md mx-auto border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 text-center">
                No applications require action at this time.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  )
}
