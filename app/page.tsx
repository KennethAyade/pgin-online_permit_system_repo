import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, Clock, CheckCircle, Users, Building2, ArrowRight, Mail, Phone, MapPin } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Official Header */}
      <header className="bg-white border-b-4 border-blue-700 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-700 text-white p-3 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SAG Permit System</h1>
                <p className="text-sm text-gray-600">MGB Regional Office / PGIN</p>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-md">
                  Register Now
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-blue-600/30 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium text-blue-100">Official Government Portal</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Online Permit Application System
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
              Digital transformation of Industrial Sand and Gravel (ISAG) and<br />
              Commercial Sand and Gravel (CSAG) permit application process
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all">
                  Apply for Permit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-3 border-white/80 text-white hover:bg-white/10 hover:border-white font-bold px-10 py-7 text-lg backdrop-blur-sm">
                  Access Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-blue-200 text-sm">
              Secure • Fast • Reliable
            </p>
          </div>
        </div>
      </section>

      {/* Portal Access Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Portal</h3>
              <p className="text-gray-600 text-lg">Select the appropriate portal for your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Applicant Portal */}
              <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all hover:scale-105 transform duration-200">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 border-b-2 border-blue-200 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-700 text-white p-4 rounded-xl shadow-md">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Applicant Portal</CardTitle>
                      <CardDescription className="text-base text-gray-700 mt-1">
                        For permit applicants
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Submit permit applications online</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Track application status in real-time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Upload and manage documents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Receive email notifications</span>
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <Link href="/register" className="block">
                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-6 text-base">
                        Register as Applicant
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-6 text-base">
                        Sign In to Portal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Portal */}
              <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all hover:scale-105 transform duration-200">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-200 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-700 text-white p-4 rounded-xl shadow-md">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
                      <CardDescription className="text-base text-gray-700 mt-1">
                        For MGB administrators
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Review and evaluate applications</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Approve or reject permits</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Manage application workflow</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Generate reports and statistics</span>
                    </li>
                  </ul>
                  <Link href="/login" className="block">
                    <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-6 text-base">
                      Admin Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h3 className="text-4xl font-bold text-gray-900 mb-3">Why Use Our System?</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience a modern, efficient, and secure permit application process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-gray-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <FileText className="h-8 w-8 text-blue-700" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Online Application</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Submit permit applications digitally with our intuitive step-by-step wizard. No more paper forms or office visits.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Clock className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Monitor your application status 24/7. Get instant updates via email and in-app notifications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-8 w-8 text-purple-700" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  Government-grade security with encrypted document storage and secure authentication.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Permit Types Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h3 className="text-4xl font-bold text-gray-900 mb-3">Permit Types</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We process two types of Sand and Gravel permits
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ISAG Card */}
            <Card className="border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 border-b-2 border-blue-200 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-700 p-3 rounded-xl shadow-md">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">ISAG</CardTitle>
                    <CardDescription className="text-base text-gray-700 font-medium">
                      Industrial Sand and Gravel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-blue-700" />
                    </div>
                    <span><strong>5-Year Work Program</strong> required</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-blue-700" />
                    </div>
                    <span><strong>EPEP</strong> (Environmental Protection and Enhancement Program)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-blue-700" />
                    </div>
                    <span>Comprehensive documentation package</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-blue-700" />
                    </div>
                    <span>Technical and financial capability proof</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CSAG Card */}
            <Card className="border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 border-b-2 border-green-200 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-700 p-3 rounded-xl shadow-md">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">CSAG</CardTitle>
                    <CardDescription className="text-base text-gray-700 font-medium">
                      Commercial Sand and Gravel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-700" />
                    </div>
                    <span><strong>1-Year Work Program</strong> required</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-700" />
                    </div>
                    <span>Simplified documentation process</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-700" />
                    </div>
                    <span>Streamlined application workflow</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-700" />
                    </div>
                    <span>Faster processing time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h3 className="text-4xl font-bold text-gray-900 mb-3">How It Works</h3>
            <p className="text-gray-600 text-lg">Simple steps to get your permit</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Register", desc: "Create your account", icon: Users },
                { step: "2", title: "Apply", desc: "Submit application", icon: FileText },
                { step: "3", title: "Track", desc: "Monitor progress", icon: Clock },
                { step: "4", title: "Receive", desc: "Get your permit", icon: CheckCircle },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="text-center">
                    <div className="bg-blue-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <Icon className="h-6 w-6 text-blue-700 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Create an account and begin your permit application process today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl">
                Register Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-3 border-white text-white hover:bg-white/10 font-bold px-10 py-7 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t-4 border-blue-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-700 text-white p-2 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">SAG Permit System</h4>
                  <p className="text-gray-400 text-sm">MGB Regional Office / PGIN</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Official online permit application system for Industrial Sand and Gravel (ISAG) and Commercial Sand and Gravel (CSAG) permits.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />Register
                </Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />Sign In
                </Link></li>
                <li><Link href="/applications/new" className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />New Application
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>MGB Regional Office / PGIN</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>info@mgb.gov.ph</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Contact your regional office</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} SAG Permit Online Application System. All rights reserved.</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">MGB Regional Office / PGIN - Official Government Portal</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
