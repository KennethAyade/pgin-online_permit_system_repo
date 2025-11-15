import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FileText, Shield, Clock, CheckCircle, Users, Building2, ArrowRight, Mail, Phone, MapPin } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">

      {/* Hero Section */}
      <section className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 border border-white/20 rounded px-4 py-1.5 mb-6">
              <span className="text-sm font-medium">Official Government Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
              SAG Permit Online Application System
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permit applications
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-medium px-8 py-6">
                  Apply for Permit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-medium px-8 py-6">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access Cards */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Portal</h2>
              <p className="text-gray-600">Select the appropriate portal for your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Applicant Portal */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-900 text-white p-3 rounded">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Applicant Portal</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        For permit applicants
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 pb-5">
                  <ul className="space-y-2.5 mb-5">
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Submit permit applications online</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Track application status in real-time</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Upload and manage documents</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Receive email notifications</span>
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Link href="/register" className="block">
                      <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-5">
                        Register as Applicant
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-5">
                        Sign In to Portal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Portal */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-700 text-white p-3 rounded">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Admin Portal</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        For MGB administrators
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 pb-5">
                  <ul className="space-y-2.5 mb-5">
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Review and evaluate applications</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Approve or reject permits</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Manage application workflow</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Generate reports and statistics</span>
                    </li>
                  </ul>
                  <Link href="/login" className="block">
                    <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-5">
                      Admin Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Authorized personnel only
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">System Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A modern, efficient, and secure permit application process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border border-gray-200">
              <CardHeader className="text-center pb-4">
                <div className="bg-blue-50 w-14 h-14 rounded flex items-center justify-center mb-4 mx-auto border border-blue-100">
                  <FileText className="h-6 w-6 text-blue-900" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Online Application</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center text-sm leading-relaxed">
                  Submit permit applications digitally with our step-by-step wizard. No paper forms required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="text-center pb-4">
                <div className="bg-green-50 w-14 h-14 rounded flex items-center justify-center mb-4 mx-auto border border-green-100">
                  <Clock className="h-6 w-6 text-green-700" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center text-sm leading-relaxed">
                  Monitor your application status 24/7 with email and in-app notifications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader className="text-center pb-4">
                <div className="bg-gray-100 w-14 h-14 rounded flex items-center justify-center mb-4 mx-auto border border-gray-200">
                  <Shield className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center text-sm leading-relaxed">
                  Government-grade security with encrypted document storage and authentication.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Permit Types Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Permit Types</h2>
            <p className="text-gray-600">
              Two types of Sand and Gravel permits are available
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* ISAG Card */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900 p-3 rounded">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">ISAG</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Industrial Sand and Gravel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span><strong>5-Year Work Program</strong> required</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span><strong>EPEP</strong> (Environmental Protection and Enhancement Program)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive documentation package</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Technical and financial capability proof</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CSAG Card */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-700 p-3 rounded">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">CSAG</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Commercial Sand and Gravel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span><strong>1-Year Work Program</strong> required</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Simplified documentation process</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Streamlined application workflow</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>Faster processing time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Application Process</h2>
            <p className="text-gray-600">Four simple steps to get your permit</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { step: "1", title: "Register", desc: "Create account", icon: Users },
                { step: "2", title: "Apply", desc: "Submit application", icon: FileText },
                { step: "3", title: "Track", desc: "Monitor status", icon: Clock },
                { step: "4", title: "Receive", desc: "Get permit", icon: CheckCircle },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="text-center">
                    <div className="bg-blue-900 text-white w-12 h-12 rounded flex items-center justify-center text-lg font-semibold mx-auto mb-3">
                      {item.step}
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <Icon className="h-5 w-5 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-3">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Create an account and begin your permit application process today
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-medium px-8 py-6">
                Register Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-medium px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  )
}
