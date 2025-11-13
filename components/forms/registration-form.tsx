"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Mail, Lock, Calendar, Phone, Building, MapPin } from "lucide-react"

export function RegistrationForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const acceptTerms = watch("acceptTerms")

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/users/register", {
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
        setError(result.error || "Registration failed")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-300 bg-green-50">
        <AlertDescription className="text-green-800">
          Registration successful! Please check your email to verify your account.
          Redirecting to login...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="fullName"
              placeholder="John Doe"
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
            Email Address <span className="text-red-500">*</span>
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
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate" className="text-sm font-medium text-gray-700">
            Birth Date <span className="text-red-500">*</span>
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

        <div className="space-y-2">
          <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
            Mobile Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="+63 9XX XXX XXXX"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("mobileNumber")}
            />
          </div>
          {errors.mobileNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.mobileNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
            Company Name
          </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="companyName"
              placeholder="Your Company Name"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("companyName")}
            />
          </div>
          {errors.companyName && (
            <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
          Address
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            id="address"
            placeholder="Your Address"
            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            {...register("address")}
          />
        </div>
        {errors.address && (
          <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-3 pt-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setValue("acceptTerms", checked === true)}
          className="mt-1"
        />
        <Label htmlFor="acceptTerms" className="text-sm font-normal text-gray-700 leading-relaxed">
          I accept the <a href="#" className="text-blue-700 hover:underline">terms and conditions</a> and <a href="#" className="text-blue-700 hover:underline">privacy policy</a>
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
      )}

      <Button 
        type="submit" 
        className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Register Now"
        )}
      </Button>
    </form>
  )
}
