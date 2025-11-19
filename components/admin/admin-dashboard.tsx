"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, XCircle, Building2, Users, ArrowRight, CheckSquare } from "lucide-react"
import { AdminAcceptanceRequirementsQueue } from "./acceptance-requirements-queue"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardStats {
  total: number
  pending: number
  approved: number
  returned: number
  isag: number
  csag: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      const result = await response.json()

      if (result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
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

  if (!stats) {
    return null
  }

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    {
      label: "Returned",
      value: stats.returned,
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
    {
      label: "ISAG",
      value: stats.isag,
      icon: Building2,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      borderColor: "border-purple-200",
    },
    {
      label: "CSAG",
      value: stats.csag,
      icon: Users,
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
    },
  ]

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="bg-white border border-gray-200 p-1 w-full justify-start">
        <TabsTrigger value="overview" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white text-xs sm:text-sm">
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Overview</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="acceptance" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
          <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">Acceptance Requirements Queue</span>
          <span className="lg:hidden">Accept. Queue</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`border-2 ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">
                    {stat.label}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-1.5 sm:p-2 rounded-lg`}>
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.textColor}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/applications">
              <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-700" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">View All Applications</div>
                    <div className="text-xs text-gray-500">Manage all permit applications</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Button>
            </Link>
            <Link href="/admin/applications?status=SUBMITTED">
              <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 hover:bg-yellow-50 hover:border-yellow-300">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Pending Review</div>
                    <div className="text-xs text-gray-500">Applications awaiting review</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-semibold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Review</span>
                <span className="font-semibold text-yellow-700">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved</span>
                <span className="font-semibold text-green-700">{stats.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Returned</span>
                <span className="font-semibold text-red-700">{stats.returned}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </TabsContent>

      <TabsContent value="acceptance">
        <AdminAcceptanceRequirementsQueue />
      </TabsContent>
    </Tabs>
  )
}
