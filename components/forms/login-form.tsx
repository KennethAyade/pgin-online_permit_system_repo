"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError("")

    try {
      // Check if this is an admin login (you can add a checkbox or detect from email domain)
      const isAdmin = data.email.includes("@admin") || data.email.includes("@mgb") || data.email.includes("@pgin")
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: isAdmin ? "admin" : "user",
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        // Check session to determine redirect
        const sessionResponse = await fetch("/api/auth/session")
        const session = await sessionResponse.json()
        
        if ((session.user as any)?.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

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
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <a
          href="/recover-password"
          className="text-sm text-blue-700 hover:text-blue-800 hover:underline font-medium"
        >
          Can&apos;t sign in to your account?
        </a>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}
