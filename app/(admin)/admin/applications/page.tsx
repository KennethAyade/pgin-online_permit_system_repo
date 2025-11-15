"use client"

import { useEffect, useState } from "react"
import { AdminApplicationTable } from "@/components/admin/application-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, FileText, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminApplicationsPage() {
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

      const response = await fetch(`/api/admin/applications?${params.toString()}`)
      const result = await response.json()

      if (result.applications) {
        let filtered = result.applications

        // Client-side search filter
        if (filters.search) {
          filtered = filtered.filter((app: any) =>
            app.applicationNo.toLowerCase().includes(filters.search.toLowerCase()) ||
            app.projectName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            app.user?.fullName?.toLowerCase().includes(filters.search.toLowerCase())
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Applications</h1>
            <p className="text-blue-100">
              Manage and evaluate permit applications
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by application number, project name, or applicant..."
                className="pl-10 border-gray-300"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full md:w-[200px] border-gray-300">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="INITIAL_CHECK">Initial Check</SelectItem>
                <SelectItem value="TECHNICAL_REVIEW">Technical Review</SelectItem>
                <SelectItem value="FOR_FINAL_APPROVAL">For Final Approval</SelectItem>
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      ) : (
        <AdminApplicationTable applications={applications} />
      )}
    </div>
  )
}
