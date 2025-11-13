import { LoginForm } from "@/components/forms/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 text-white rounded-xl mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SAG Permit System</h1>
          <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
        </div>
        
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Sign In to Your Account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access the permit application portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link href="/register" className="text-blue-700 hover:text-blue-800 font-medium hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <p className="mt-6 text-center text-xs text-gray-500">
          Official Government Portal - Secure Access
        </p>
      </div>
    </div>
  )
}
