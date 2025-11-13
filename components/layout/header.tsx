"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Building2, Bell } from "lucide-react"
import { NotificationBell } from "@/components/shared/notification-bell"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b-2 border-blue-700 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-blue-700 text-white p-2 rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SAG Permit System</h1>
              <p className="text-xs text-gray-600">MGB Regional Office / PGIN</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/applications">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                    Applications
                  </Button>
                </Link>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-blue-700 hover:bg-blue-50">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{session.user?.name || session.user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Manage Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
