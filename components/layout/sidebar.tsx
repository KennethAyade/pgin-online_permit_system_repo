"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Inbox,
  User,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    href: "/applications",
    icon: FileText,
  },
  {
    name: "For Action",
    href: "/for-action",
    icon: Inbox,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menu
          </h2>
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
