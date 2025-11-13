"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationCard } from "./application-card"
import { Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function RecentApplications() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications?limit=5")
      const result = await response.json()

      if (result.applications) {
        setApplications(result.applications.slice(0, 5))
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Applications</CardTitle>
        <Link href="/applications">
          <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No applications yet</p>
            <Link href="/applications/new">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Create Your First Application
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
