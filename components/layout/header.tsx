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
import { User, LogOut, Settings, Building2 } from "lucide-react"
import { NotificationBell } from "@/components/shared/notification-bell"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-medium text-gray-800 hover:text-gray-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-900 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              SAG Permit System
            </span>
            <span className="text-xs text-gray-600">
              MGB Regional Office / PGIN
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/applications">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Applications
                </Button>
              </Link>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Manage account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="cursor-pointer text-red-700 focus:text-red-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="text-sm font-medium bg-blue-900 hover:bg-blue-800">
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
