"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recoverPasswordSchema, type RecoverPasswordInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Calendar } from "lucide-react"

export function RecoverPasswordForm() {
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverPasswordInput>({
    resolver: zodResolver(recoverPasswordSchema),
  })

  const onSubmit = async (data: RecoverPasswordInput) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/users/recover-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          birthdate: data.birthdate.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to process request")
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-300 bg-green-50">
        <AlertDescription className="text-green-800">
          If an account exists with this email, a password reset link has been sent.
          Please check your email.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="fullName"
            placeholder="Enter your full name"
            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            {...register("fullName")}
          />
        </div>
        {errors.fullName && (
          <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate" className="text-sm font-medium text-gray-700">
          Birth Date
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="birthdate"
            type="date"
            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            {...register("birthdate", {
              valueAsDate: true,
            })}
          />
        </div>
        {errors.birthdate && (
          <p className="text-sm text-red-600 mt-1">{errors.birthdate.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Recover Password"
        )}
      </Button>
    </form>
  )
}
