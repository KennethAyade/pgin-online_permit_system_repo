"use client"

import { useEffect, useState } from "react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Loader2 } from "lucide-react"
import { Shield } from "lucide-react"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-blue-100">
              Manage and evaluate permit applications
            </p>
          </div>
        </div>
      </div>

      <AdminDashboard />
    </div>
  )
}
