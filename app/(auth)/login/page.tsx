import { LoginForm } from "@/components/forms/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900 text-white rounded mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">SAG Permit System</h1>
          <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
        </div>

        <Card className="border border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-gray-900">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-sm">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
            <div className="mt-5 text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link href="/register" className="text-blue-900 hover:text-blue-800 font-medium hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-gray-500">
          Official Government Portal
        </p>
      </div>
    </div>
  )
}
