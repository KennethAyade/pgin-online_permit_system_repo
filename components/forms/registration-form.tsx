"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { registerSchema, type RegisterInput, AccountType } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Mail, Lock, Calendar, Phone, Building, MapPin } from "lucide-react"
import {
  getRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
} from "@/lib/constants/philippines-divisions"

export function RegistrationForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [barangays, setBarangays] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const accountType = watch("accountType")
  const selectedRegion = watch("region")
  const selectedProvince = watch("province")
  const selectedCity = watch("city")
  const acceptTerms = watch("acceptTerms")

  const regions = getRegions()

  // Handle region change
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionCode = e.target.value
    setValue("region", regionCode)

    const provincesList = getProvincesByRegion(regionCode)
    setProvinces(provincesList)

    // Reset dependent fields
    setValue("province", "")
    setValue("city", "")
    setValue("barangay", "")
    setCities([])
    setBarangays([])
  }

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value
    setValue("province", provinceName)

    const citiesList = getCitiesByProvince(selectedRegion, provinceName)
    setCities(citiesList)

    // Reset dependent fields
    setValue("city", "")
    setValue("barangay", "")
    setBarangays([])
  }

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value
    setValue("city", cityName)

    const barangaysList = getBarangaysByCity(selectedRegion, selectedProvince, cityName)
    setBarangays(barangaysList)

    // Reset barangay
    setValue("barangay", "")
  }

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Account Type <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="individual"
              value="INDIVIDUAL"
              {...register("accountType")}
              className="h-4 w-4 text-blue-700 cursor-pointer"
            />
            <Label
              htmlFor="individual"
              className="ml-2 text-sm font-normal text-gray-700 cursor-pointer"
            >
              Individual
            </Label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="corporate"
              value="CORPORATE"
              {...register("accountType")}
              className="h-4 w-4 text-blue-700 cursor-pointer"
            />
            <Label
              htmlFor="corporate"
              className="ml-2 text-sm font-normal text-gray-700 cursor-pointer"
            >
              Corporate
            </Label>
          </div>
        </div>
        {errors.accountType && (
          <p className="text-sm text-red-600">{errors.accountType.message}</p>
        )}
      </div>

      {/* Personal Information */}
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

        {/* Conditional Company Name Field - Only for Corporate */}
        {accountType === "CORPORATE" && (
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Company Name <span className="text-red-500">*</span>
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
        )}
      </div>

      {/* Address - Cascading Dropdowns */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Address <span className="text-red-500">*</span></h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Region Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium text-gray-700">
              Region <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="region"
                {...register("region")}
                onChange={handleRegionChange}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.region && (
              <p className="text-sm text-red-600 mt-1">{errors.region.message}</p>
            )}
          </div>

          {/* Province Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-medium text-gray-700">
              Province <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="province"
                {...register("province")}
                onChange={handleProvinceChange}
                disabled={!selectedRegion}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.name} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.province && (
              <p className="text-sm text-red-600 mt-1">{errors.province.message}</p>
            )}
          </div>

          {/* City Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">
              City/Municipality <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="city"
                {...register("city")}
                onChange={handleCityChange}
                disabled={!selectedProvince}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
            )}
          </div>

          {/* Barangay Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="barangay" className="text-sm font-medium text-gray-700">
              Barangay <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="barangay"
                {...register("barangay")}
                disabled={!selectedCity}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Barangay</option>
                {barangays.map((barangay) => (
                  <option key={barangay.name} value={barangay.name}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.barangay && (
              <p className="text-sm text-red-600 mt-1">{errors.barangay.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
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
