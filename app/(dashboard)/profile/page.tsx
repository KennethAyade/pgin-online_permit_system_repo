"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Lock, CheckCircle2 } from "lucide-react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to change password")
        return
      }

      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setError("An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg p-4 sm:p-5 lg:p-6 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
            <User className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Profile</h1>
            <p className="text-sm sm:text-base text-blue-100">Manage your account settings</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                value={session?.user?.email || ""} 
                disabled 
                className="pl-10 h-11 bg-gray-50 border-gray-300"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                value={session?.user?.name || ""} 
                disabled 
                className="pl-10 h-11 bg-gray-50 border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {success && (
            <Alert className="mb-4 border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              <AlertDescription className="text-green-800">Password changed successfully</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("currentPassword")}
                />
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters with letters and symbols"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("newPassword")}
                />
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white">
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
