import { RegistrationForm } from "@/components/forms/registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Shield, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900 text-white rounded mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">SAG Permit System</h1>
          <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Register to submit permit applications online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm />
              <div className="mt-5 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/login" className="text-blue-900 hover:text-blue-800 font-medium hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-blue-50 border border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-900" />
                  <CardTitle className="text-base font-semibold text-gray-900">Secure Registration</CardTitle>
                </div>
                <CardDescription className="text-gray-700 text-sm">
                  Your information is protected with government-grade security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900 mb-3">Requirements</CardTitle>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Valid email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Government-issued ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Project details (for applications)</span>
                  </li>
                </ul>
              </CardHeader>
            </Card>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          Official Government Portal
        </p>
      </div>
    </div>
  )
}
