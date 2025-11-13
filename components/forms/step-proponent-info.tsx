"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { User, MapPin, Phone } from "lucide-react"

interface StepProponentInfoProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepProponentInfo({ data, onUpdate }: StepProponentInfoProps) {
  const { data: session } = useSession()
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      proponentName: data.proponentName || "",
      proponentAddress: data.proponentAddress || "",
      proponentContact: data.proponentContact || "",
    },
  })

  // Auto-fill from user profile if available
  useEffect(() => {
    if (session?.user) {
      // You can fetch user details from API here
    }
  }, [session])

  const handleChange = () => {
    handleSubmit((formData) => {
      onUpdate(formData)
    })()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Proponent Information</h3>
        <p className="text-sm text-gray-600">
          Information about the applicant or company applying for the permit
        </p>
      </div>

      <form onChange={handleChange} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proponentName" className="text-sm font-medium text-gray-700">
            Proponent Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="proponentName"
              placeholder="Enter proponent name"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("proponentName")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proponentAddress" className="text-sm font-medium text-gray-700">
            Address
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="proponentAddress"
              placeholder="Enter complete address"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("proponentAddress")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proponentContact" className="text-sm font-medium text-gray-700">
            Contact Information
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="proponentContact"
              placeholder="Enter contact number or email"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("proponentContact")}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
