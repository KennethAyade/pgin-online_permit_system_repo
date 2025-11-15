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
    <aside className="w-56 min-h-screen border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Admin Panel
            </h2>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
