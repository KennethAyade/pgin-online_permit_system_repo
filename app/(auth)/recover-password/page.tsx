import { RecoverPasswordForm } from "@/components/forms/recover-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, ShieldCheck } from "lucide-react"

export default function RecoverPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 text-white rounded-xl mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SAG Permit System</h1>
          <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
        </div>
        
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Recover Your Password
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your account information to recover your password
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <RecoverPasswordForm />
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Remember your password? </span>
              <Link href="/login" className="text-blue-700 hover:text-blue-800 font-medium hover:underline">
                Sign in here
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
