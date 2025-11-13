import { RegistrationForm } from "@/components/forms/registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Shield, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 text-white rounded-xl mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SAG Permit System</h1>
          <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-gray-600">
                Register to submit permit applications online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm />
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/login" className="text-blue-700 hover:text-blue-800 font-medium hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Secure Registration</CardTitle>
                </div>
                <CardDescription className="text-gray-700">
                  Your information is protected with government-grade security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-3">What You&apos;ll Need</CardTitle>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Valid email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Government-issued ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Project details (for applications)</span>
                  </li>
                </ul>
              </CardHeader>
            </Card>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Official Government Portal - Secure Registration
        </p>
      </div>
    </div>
  )
}
