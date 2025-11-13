"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { FileText, Clock, CheckCircle2, XCircle, Building2, Users } from "lucide-react"

interface Stats {
  total: number
  pending: number
  approved: number
  returned: number
  isag: number
  csag: number
}

export function ApplicationStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/applications")
      const result = await response.json()

      if (result.applications) {
        const applications = result.applications
        const statsData: Stats = {
          total: applications.length,
          pending: applications.filter((app: any) =>
            ["SUBMITTED", "UNDER_REVIEW", "INITIAL_CHECK", "TECHNICAL_REVIEW"].includes(app.status)
          ).length,
          approved: applications.filter((app: any) =>
            ["APPROVED", "PERMIT_ISSUED"].includes(app.status)
          ).length,
          returned: applications.filter((app: any) => app.status === "RETURNED").length,
          isag: applications.filter((app: any) => app.permitType === "ISAG").length,
          csag: applications.filter((app: any) => app.permitType === "CSAG").length,
        }
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
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
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    {
      label: "Returned",
      value: stats.returned,
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    {
      label: "ISAG",
      value: stats.isag,
      icon: Building2,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
    },
    {
      label: "CSAG",
      value: stats.csag,
      icon: Users,
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-700",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.textColor}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
