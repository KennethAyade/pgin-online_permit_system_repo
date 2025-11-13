export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 border-t-2 border-blue-700 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h4 className="text-white font-semibold mb-3">About</h4>
            <p className="text-sm text-gray-400">
              Official online permit application system for Sand and Gravel permits managed by MGB Regional Office / PGIN.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/register" className="hover:text-white transition-colors">Register</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Sign In</a></li>
              <li><a href="/applications/new" className="hover:text-white transition-colors">New Application</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <p className="text-sm text-gray-400">
              MGB Regional Office / PGIN<br />
              For inquiries, please contact your regional office.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} SAG Permit Online Application System. All rights reserved.</p>
          <p className="mt-1">MGB Regional Office / PGIN - Official Government Portal</p>
        </div>
      </div>
    </footer>
  )
}
