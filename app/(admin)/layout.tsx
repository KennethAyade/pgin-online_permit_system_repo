import { ProtectedRoute } from "@/components/layout/protected-route"
import { Header } from "@/components/layout/header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Footer } from "@/components/layout/footer"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 bg-gray-50 px-6 py-6">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

