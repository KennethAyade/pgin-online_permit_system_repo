"use client"

import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface StepProjectInfoProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepProjectInfo({ data, onUpdate }: StepProjectInfoProps) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      projectName: data.projectName || "",
    },
  })

  const projectName = watch("projectName")

  // Update parent when form changes
  const handleChange = () => {
    handleSubmit((formData) => {
      onUpdate(formData)
    })()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Information</h3>
        <p className="text-sm text-gray-600">
          Provide basic information about your mining project
        </p>
      </div>

      <form onChange={handleChange} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
            Project Name
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="projectName"
              placeholder="Enter project name"
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              {...register("projectName")}
            />
          </div>
          <p className="text-xs text-gray-500">This will be used to identify your project throughout the application process</p>
        </div>
      </form>
    </div>
  )
}
