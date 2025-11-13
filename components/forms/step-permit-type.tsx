"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepPermitTypeProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepPermitType({ data, onUpdate }: StepPermitTypeProps) {
  const permitTypes = [
    {
      value: "ISAG",
      label: "ISAG (Industrial Sand and Gravel)",
      description: "Requires 5-year Work Program and EPEP",
      icon: Building2,
      requirements: [
        "5-Year Work Program",
        "EPEP (Environmental Protection and Enhancement Program)",
        "Comprehensive documentation",
      ],
      color: "blue",
    },
    {
      value: "CSAG",
      label: "CSAG (Commercial Sand and Gravel)",
      description: "Requires 1-year Work Program",
      icon: Users,
      requirements: [
        "1-Year Work Program",
        "Simplified documentation",
      ],
      color: "green",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Select Permit Type</h3>
        <p className="text-sm text-gray-600">
          Choose the type of permit you want to apply for. This selection will determine the required documents and evaluation process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {permitTypes.map((type) => {
          const Icon = type.icon
          const isSelected = data.permitType === type.value
          return (
            <Card
              key={type.value}
              className={cn(
                "cursor-pointer transition-all border-2 hover:shadow-lg",
                isSelected
                  ? "border-blue-700 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onUpdate({ permitType: type.value })}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-lg",
                      isSelected ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{type.label}</CardTitle>
                      <CardDescription className="mt-1 text-gray-600">{type.description}</CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-6 w-6 text-blue-700 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {type.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-700 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
