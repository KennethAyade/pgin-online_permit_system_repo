"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid verification token")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/users/verify-email?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          setStatus("error")
          setMessage(result.error || "Verification failed")
          return
        }

        setStatus("success")
        setMessage("Email verified successfully! You can now log in.")
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } catch (error) {
        setStatus("error")
        setMessage("An error occurred during verification")
      }
    }

    verifyEmail()
  }, [token, router])

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
          <CardContent className="pt-6 pb-6">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-700" />
                <p className="text-gray-600 font-medium">Verifying your email...</p>
              </div>
            )}

            {status === "success" && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-700" />
                </div>
                <Alert className="border-green-300 bg-green-50">
                  <AlertDescription className="text-green-800 text-center">{message}</AlertDescription>
                </Alert>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <XCircle className="h-8 w-8 text-red-700" />
                </div>
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-red-800 text-center">{message}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                  Go to Login
                </Button>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
