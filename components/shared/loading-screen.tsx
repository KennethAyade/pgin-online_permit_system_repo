import { Loader2, Building2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-700 text-white rounded-xl mb-6 animate-pulse">
          <Building2 className="h-10 w-10" />
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
        <p className="text-sm text-gray-600">SAG Permit System</p>
      </div>
    </div>
  )
}

