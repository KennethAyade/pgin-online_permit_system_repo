"use client"

import { useState } from "react"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { User, LogOut, Settings, Building2, Menu, X, Home, FileText, Bell } from "lucide-react"
import { NotificationBell } from "@/components/shared/notification-bell"

export function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-medium text-gray-800 hover:text-gray-900 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-semibold leading-tight text-gray-900">
              SAG Permit System
            </span>
            <span className="text-xs text-gray-600 leading-tight">
              MGB Regional Office / PGIN
            </span>
          </div>
          <div className="flex sm:hidden">
            <span className="text-sm font-semibold text-gray-900">
              SAG Permit
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/applications">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Applications
                </Button>
              </Link>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden lg:inline max-w-[150px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex cursor-pointer items-center gap-2 text-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      Manage account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
                  size="sm"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {session && <NotificationBell />}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-700">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="text-base font-semibold">Menu</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {session ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-col gap-1">
                      <SheetClose asChild>
                        <Link href="/dashboard">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={closeMobileMenu}
                          >
                            <Home className="h-5 w-5 mr-3" />
                            Dashboard
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/applications">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={closeMobileMenu}
                          >
                            <FileText className="h-5 w-5 mr-3" />
                            Applications
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/profile">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                            onClick={closeMobileMenu}
                          >
                            <Settings className="h-5 w-5 mr-3" />
                            Manage Account
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          closeMobileMenu()
                          signOut({ callbackUrl: "/login" })
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={closeMobileMenu}
                        >
                          Sign In
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/register">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={closeMobileMenu}
                        >
                          Register
                        </Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
