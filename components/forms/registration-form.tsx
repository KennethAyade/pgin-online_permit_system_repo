"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { registerSchema, type RegisterInput, AccountType } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Mail, Lock, Calendar, Phone, Building, MapPin, AlertCircle, Upload, FileCheck } from "lucide-react"
import { philippinesAddressAPI } from "@/lib/services/philippines-address-api"

export function RegistrationForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [regions, setRegions] = useState<any[]>([])
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [barangays, setBarangays] = useState<any[]>([])
  const [loadingRegions, setLoadingRegions] = useState(true)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)
  const [addressError, setAddressError] = useState<string>("")

  // File upload states for corporate accounts
  const [presidentAuthLetter, setPresidentAuthLetter] = useState<File | null>(null)
  const [governmentId, setGovernmentId] = useState<File | null>(null)
  const [companyId, setCompanyId] = useState<File | null>(null)
  const [secDtiCertificate, setSecDtiCertificate] = useState<File | null>(null)

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

  // Load regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true)
      setAddressError("")
      try {
        const data = await philippinesAddressAPI.getRegions()
        setRegions(data)
      } catch (err) {
        console.error("Error loading regions:", err)
        setAddressError("Failed to load regions. Please refresh the page.")
      } finally {
        setLoadingRegions(false)
      }
    }
    loadRegions()
  }, [])

  // Handle region change
  const handleRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionCode = e.target.value
    setValue("region", regionCode)
    setAddressError("")

    // Reset dependent fields
    setValue("province", "")
    setValue("city", "")
    setValue("barangay", "")
    setCities([])
    setBarangays([])

    if (!regionCode) {
      setProvinces([])
      return
    }

    setLoadingProvinces(true)
    try {
      const data = await philippinesAddressAPI.getProvincesByRegion(regionCode)
      setProvinces(data)
    } catch (err) {
      console.error("Error loading provinces:", err)
      setAddressError("Failed to load provinces. Please try again.")
      setProvinces([])
    } finally {
      setLoadingProvinces(false)
    }
  }

  // Handle province change
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value
    setValue("province", provinceCode)
    setAddressError("")

    // Reset dependent fields
    setValue("city", "")
    setValue("barangay", "")
    setBarangays([])

    if (!provinceCode) {
      setCities([])
      return
    }

    setLoadingCities(true)
    try {
      const data = await philippinesAddressAPI.getCitiesByProvince(selectedRegion, provinceCode)
      setCities(data)
    } catch (err) {
      console.error("Error loading cities:", err)
      setAddressError("Failed to load cities. Please try again.")
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  // Handle city change
  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityCode = e.target.value
    setValue("city", cityCode)
    setAddressError("")

    // Reset barangay
    setValue("barangay", "")

    if (!cityCode) {
      setBarangays([])
      return
    }

    setLoadingBarangays(true)
    try {
      const data = await philippinesAddressAPI.getBarangaysByCity(cityCode)
      setBarangays(data)
    } catch (err) {
      console.error("Error loading barangays:", err)
      setAddressError("Failed to load barangays. Please try again.")
      setBarangays([])
    } finally {
      setLoadingBarangays(false)
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError("")

    try {
      // Create FormData for file uploads
      const formData = new FormData()

      // Append all form fields
      formData.append("accountType", data.accountType)
      formData.append("email", data.email)
      formData.append("password", data.password)
      formData.append("fullName", data.fullName)
      formData.append("birthdate", data.birthdate.toISOString())
      if (data.mobileNumber) formData.append("mobileNumber", data.mobileNumber)
      if (data.companyName) formData.append("companyName", data.companyName)

      // Representative information
      if (data.representativeFullName) formData.append("representativeFullName", data.representativeFullName)
      if (data.representativeEmail) formData.append("representativeEmail", data.representativeEmail)
      if (data.representativeContactNumber) formData.append("representativeContactNumber", data.representativeContactNumber)
      if (data.representativeBirthday) formData.append("representativeBirthday", data.representativeBirthday.toISOString())

      // President information
      if (data.presidentFullName) formData.append("presidentFullName", data.presidentFullName)

      // Address components
      formData.append("region", data.region)
      formData.append("province", data.province)
      formData.append("city", data.city)
      formData.append("barangay", data.barangay)

      formData.append("acceptTerms", data.acceptTerms.toString())

      // Append files if corporate account
      if (data.accountType === "CORPORATE") {
        if (presidentAuthLetter) formData.append("presidentAuthLetter", presidentAuthLetter)
        if (governmentId) formData.append("governmentId", governmentId)
        if (companyId) formData.append("companyId", companyId)
        if (secDtiCertificate) formData.append("secDtiCertificate", secDtiCertificate)
      }

      const response = await fetch("/api/users/register", {
        method: "POST",
        // Don't set Content-Type header - browser will set it automatically for FormData
        body: formData,
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
              placeholder="Your full name"
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
              placeholder="name@company.com"
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

      {/* Corporate Representative Information - Only for Corporate */}
      {accountType === "CORPORATE" && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700">
            Representative / Authorized Signatory <span className="text-red-500">*</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="representativeFullName" className="text-sm font-medium text-gray-700">
                Representative Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="representativeFullName"
                  placeholder="Representative's full name"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("representativeFullName")}
                />
              </div>
              {errors.representativeFullName && (
                <p className="text-sm text-red-600 mt-1">{errors.representativeFullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="representativeEmail" className="text-sm font-medium text-gray-700">
                Representative Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="representativeEmail"
                  type="email"
                  placeholder="representative@company.com"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("representativeEmail")}
                />
              </div>
              {errors.representativeEmail && (
                <p className="text-sm text-red-600 mt-1">{errors.representativeEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="representativeContactNumber" className="text-sm font-medium text-gray-700">
                Representative Contact Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="representativeContactNumber"
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("representativeContactNumber")}
                />
              </div>
              {errors.representativeContactNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.representativeContactNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="representativeBirthday" className="text-sm font-medium text-gray-700">
                Representative Birthday <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="representativeBirthday"
                  type="date"
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  {...register("representativeBirthday", {
                    valueAsDate: true,
                  })}
                />
              </div>
              {errors.representativeBirthday && (
                <p className="text-sm text-red-600 mt-1">{errors.representativeBirthday.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* President Information - Only for Corporate */}
      {accountType === "CORPORATE" && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700">
            Company President <span className="text-red-500">*</span>
          </h3>

          <div className="space-y-2">
            <Label htmlFor="presidentFullName" className="text-sm font-medium text-gray-700">
              President's Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="presidentFullName"
                placeholder="President's full name"
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register("presidentFullName")}
              />
            </div>
            {errors.presidentFullName && (
              <p className="text-sm text-red-600 mt-1">{errors.presidentFullName.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Address - Cascading Dropdowns */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Address <span className="text-red-500">*</span></h3>

        {addressError && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{addressError}</AlertDescription>
          </Alert>
        )}

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
                disabled={loadingRegions}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingRegions ? "Loading regions..." : "Select Region"}
                </option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.regionName || region.name}
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
                disabled={!selectedRegion || loadingProvinces}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingProvinces ? "Loading provinces..." : "Select Province"}
                </option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
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
                disabled={!selectedProvince || loadingCities}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingCities ? "Loading cities..." : "Select City"}
                </option>
                {cities.map((city) => (
                  <option key={city.code} value={city.code}>
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
                disabled={!selectedCity || loadingBarangays}
                className="pl-10 pr-4 h-11 w-full border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingBarangays ? "Loading barangays..." : "Select Barangay"}
                </option>
                {barangays.map((barangay) => (
                  <option key={barangay.code} value={barangay.code}>
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

      {/* Required Document Uploads - Only for Corporate */}
      {accountType === "CORPORATE" && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700">
            Required Documents <span className="text-red-500">*</span>
          </h3>

          {/* Simple list-style upload layout as specified */}
          <div className="space-y-3">
            {/* President Authorization Letter */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">
                  President's Authorization Letter <span className="text-red-500">*</span>
                </Label>
                {presidentAuthLetter && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {presidentAuthLetter.name}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <input
                  type="file"
                  id="presidentAuthLetter"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPresidentAuthLetter(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="presidentAuthLetter"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
              </div>
            </div>

            {/* Government ID */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">
                  Government ID <span className="text-red-500">*</span>
                </Label>
                {governmentId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {governmentId.name}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <input
                  type="file"
                  id="governmentId"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setGovernmentId(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="governmentId"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
              </div>
            </div>

            {/* Company ID */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">
                  Company ID <span className="text-red-500">*</span>
                </Label>
                {companyId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {companyId.name}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <input
                  type="file"
                  id="companyId"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setCompanyId(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="companyId"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
              </div>
            </div>

            {/* SEC/DTI Registration Certificate */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">
                  SEC or DTI Registration Certificate <span className="text-red-500">*</span>
                </Label>
                {secDtiCertificate && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {secDtiCertificate.name}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <input
                  type="file"
                  id="secDtiCertificate"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setSecDtiCertificate(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="secDtiCertificate"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

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
