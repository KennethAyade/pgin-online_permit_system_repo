import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <p className="text-center md:text-left">
              &copy; {new Date().getFullYear()} SAG Permit System
            </p>
            <span className="hidden md:inline text-gray-300">|</span>
            <p className="text-center md:text-left">
              MGB Regional Office / PGIN
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/register" className="hover:text-gray-900">
              Register
            </Link>
            <Link href="/login" className="hover:text-gray-900">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
