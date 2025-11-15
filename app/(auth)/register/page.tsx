import { RegistrationForm } from "@/components/forms/registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2, Shield, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Branding header */}
      <header className="pt-10 pb-4 flex justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">SAG Permit System</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            MGB Regional Office / PGIN
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pb-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start">
          {/* Left: registration card */}
          <Card className="w-full shadow-sm border-slate-200 md:flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Create Account
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-600">
                Register to submit permit applications online
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <RegistrationForm />
              <div className="mt-5 text-center text-xs md:text-sm">
                <span className="text-slate-600">Already have an account? </span>
                <Link
                  href="/login"
                  className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
                >
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Right: security + requirements column */}
          <div className="w-full md:w-80 space-y-4">
            <Card className="border-blue-100 bg-blue-50/70">
              <CardHeader className="pb-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 shadow-xs">
                    <Shield className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Secure Registration
                  </CardTitle>
                </div>
                <CardDescription className="text-xs leading-relaxed text-slate-700">
                  Your information is protected with government-grade security.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Requirements
                </CardTitle>
                <ul className="mt-3 space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-[2px] h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Valid email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-[2px] h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-[2px] h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Government-issued ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-[2px] h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>Project details (for applications)</span>
                  </li>
                </ul>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 text-center text-[11px] text-slate-400">
        Official Government Portal
      </footer>
    </div>
  )
}
