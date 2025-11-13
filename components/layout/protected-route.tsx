"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "loading") return

    if (requireAuth && !session) {
      router.push("/login")
      return
    }

    if (requireAdmin && (session?.user as any)?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // Redirect admin users away from user dashboard
    if (pathname?.startsWith("/dashboard") && (session?.user as any)?.role === "admin") {
      router.push("/admin")
      return
    }

    // Redirect regular users away from admin panel
    if (pathname?.startsWith("/admin") && (session?.user as any)?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router, requireAuth, requireAdmin, pathname])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (requireAuth && !session) {
    return null
  }

  if (requireAdmin && (session?.user as any)?.role !== "admin") {
    return null
  }

  return <>{children}</>
}

