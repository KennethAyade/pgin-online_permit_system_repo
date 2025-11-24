"use client"

import { useEffect, useState } from "react"
import { ApplicationCard } from "@/components/application/application-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Loader2, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all", // "all" = no status filter
    permitType: "all", // "all" = no permitType filter
    search: "",
  })

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.permitType !== "all") params.append("permitType", filters.permitType)

      const response = await fetch(`/api/applications?${params.toString()}`)
      const result = await response.json()

      if (result.applications) {
        let filtered = result.applications

        // Client-side search filter
        if (filters.search) {
          filtered = filtered.filter((app: any) =>
            app.applicationNo.toLowerCase().includes(filters.search.toLowerCase()) ||
            app.projectName?.toLowerCase().includes(filters.search.toLowerCase())
          )
        }

        setApplications(filtered)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              My Applications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage your permit applications
            </p>
          </div>
          <Link href="/applications/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 bg-blue-700 hover:bg-blue-800">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by application number or project name..."
                className="pl-10 border-gray-300"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full md:w-[180px] border-gray-300">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.permitType}
              onValueChange={(value) => setFilters({ ...filters, permitType: value })}
            >
              <SelectTrigger className="w-full md:w-[180px] border-gray-300">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ISAG">ISAG</SelectItem>
                <SelectItem value="CSAG">CSAG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No applications found</p>
            <Link href="/applications/new">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Create New Application
              </Button>
            </Link>
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
