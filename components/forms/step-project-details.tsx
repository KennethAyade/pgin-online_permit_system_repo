"use client"

import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Users, Banknote, Info } from "lucide-react"

interface StepProjectDetailsProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepProjectDetails({ data, onUpdate }: StepProjectDetailsProps) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      projectArea: data.projectArea?.toString() || "",
      footprintArea: data.footprintArea?.toString() || "",
      numEmployees: data.numEmployees?.toString() || "",
      projectCost: data.projectCost?.toString() || "",
    },
  })

  const handleChange = () => {
    handleSubmit((formData) => {
      // Validate numeric fields (no commas, no spaces)
      const numericFields = ["projectArea", "footprintArea", "numEmployees", "projectCost"]
      const processedData: any = {}

      numericFields.forEach((field) => {
        const value = formData[field as keyof typeof formData]
        if (value) {
          // Remove commas and spaces
          const cleaned = value.toString().replace(/[,\s]/g, "")
          if (field === "numEmployees") {
            processedData[field] = parseInt(cleaned) || undefined
          } else {
            processedData[field] = cleaned || undefined
          }
        }
      })

      onUpdate(processedData)
    })()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Details</h3>
        <p className="text-sm text-gray-600">
          Provide detailed technical and financial information about your project
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Note:</strong> All numeric fields accept numbers and decimal points only. Commas and spaces are not allowed.
        </AlertDescription>
      </Alert>

      <form onChange={handleChange} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectArea" className="text-sm font-medium text-gray-700">
              Project Area (hectares)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="projectArea"
                type="text"
                placeholder="0.00"
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register("projectArea")}
              />
            </div>
            <p className="text-xs text-gray-500">Total area of the project site</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footprintArea" className="text-sm font-medium text-gray-700">
              Footprint Area (hectares)
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="footprintArea"
                type="text"
                placeholder="0.00"
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register("footprintArea")}
              />
            </div>
            <p className="text-xs text-gray-500">Actual mining/extraction area</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numEmployees" className="text-sm font-medium text-gray-700">
              Number of Employees
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="numEmployees"
                type="text"
                placeholder="0"
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register("numEmployees")}
              />
            </div>
            <p className="text-xs text-gray-500">Expected workforce size</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectCost" className="text-sm font-medium text-gray-700">
              Project Cost (PHP)
            </Label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="projectCost"
                type="text"
                placeholder="0.00"
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...register("projectCost")}
              />
            </div>
            <p className="text-xs text-gray-500">Total estimated project investment</p>
          </div>
        </div>
      </form>
    </div>
  )
}
