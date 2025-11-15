import { ApplicationStats } from "@/components/application/application-stats"
import { RecentApplications } from "@/components/application/recent-applications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default async function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome to your SAG Permit Application Dashboard
            </p>
          </div>
          <Link href="/applications/new">
            <Button className="gap-2 bg-blue-900 hover:bg-blue-800">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <ApplicationStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <RecentApplications />
        </div>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/applications/new" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 px-3 hover:bg-gray-50 border-gray-300">
                <FileText className="h-4 w-4 mr-2.5 text-gray-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">Create New Application</div>
                  <div className="text-xs text-gray-500">Start a new permit application</div>
                </div>
              </Button>
            </Link>
            <Link href="/for-action" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 px-3 hover:bg-gray-50 border-gray-300">
                <AlertCircle className="h-4 w-4 mr-2.5 text-gray-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">For Action</div>
                  <div className="text-xs text-gray-500">Applications requiring attention</div>
                </div>
              </Button>
            </Link>
            <Link href="/applications" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-2.5 px-3 hover:bg-gray-50 border-gray-300">
                <Clock className="h-4 w-4 mr-2.5 text-gray-700" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">View All Applications</div>
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
