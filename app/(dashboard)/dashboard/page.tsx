import { ApplicationStats } from "@/components/application/application-stats"
import { RecentApplications } from "@/components/application/recent-applications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-blue-100">
              Welcome to your SAG Permit Application Dashboard
            </p>
          </div>
          <Link href="/applications/new">
            <Button className="bg-white text-blue-700 hover:bg-gray-100 font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <ApplicationStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <RecentApplications />
        </div>

        {/* Quick Actions */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/applications/new" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300">
                <FileText className="h-5 w-5 mr-3 text-blue-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Create New Application</div>
                  <div className="text-xs text-gray-500">Start a new permit application</div>
                </div>
              </Button>
            </Link>
            <Link href="/for-action" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-yellow-50 hover:border-yellow-300">
                <AlertCircle className="h-5 w-5 mr-3 text-yellow-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">For Action</div>
                  <div className="text-xs text-gray-500">Applications requiring attention</div>
                </div>
              </Button>
            </Link>
            <Link href="/applications" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-gray-50">
                <Clock className="h-5 w-5 mr-3 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">View All Applications</div>
                  <div className="text-xs text-gray-500">Manage your applications</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
