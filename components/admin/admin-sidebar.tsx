"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    href: "/admin/applications",
    icon: FileText,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm">
      <div className="p-4">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-700" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Admin Panel</h2>
          </div>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-700 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
