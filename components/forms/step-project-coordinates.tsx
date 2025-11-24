"use client"

import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface CoordinatePoint {
  latitude: string
  longitude: string
}

interface ProjectCoordinates {
  point1: CoordinatePoint
  point2: CoordinatePoint
  point3: CoordinatePoint
  point4: CoordinatePoint
}

interface StepProjectCoordinatesProps {
  data: any
  onUpdate: (data: any) => void
  applicationStatus?: string
  coordinateReviewRemarks?: string
  isReadOnly?: boolean
}

export function StepProjectCoordinates({
  data,
  onUpdate,
  applicationStatus,
  coordinateReviewRemarks,
  isReadOnly = false
}: StepProjectCoordinatesProps) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      projectCoordinates: data.projectCoordinates || {
        point1: { latitude: "", longitude: "" },
        point2: { latitude: "", longitude: "" },
        point3: { latitude: "", longitude: "" },
        point4: { latitude: "", longitude: "" },
      },
    },
  })

  const coordinates = watch("projectCoordinates")

  // Update parent when form changes
  const handleChange = () => {
    if (isReadOnly) return
    handleSubmit((formData) => {
      onUpdate(formData)
    })()
  }

  // Status display helpers
  const isPendingApproval = applicationStatus === "PENDING_COORDINATE_APPROVAL"
  const isRejected = applicationStatus === "COORDINATE_REVISION_REQUIRED"
  const isApproved = applicationStatus === "DRAFT" && data.coordinateApprovedAt

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Project Coordinates</h3>
        <p className="text-sm text-gray-600">
          Enter the 4 boundary points that define your project area. These coordinates will be reviewed by the admin to ensure there is no overlap with existing projects.
        </p>
      </div>

      {/* Status Alerts */}
      {isPendingApproval && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-700" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Coordinates Submitted for Review</strong>
            <br />
            Your project coordinates are being reviewed by the admin. You will be notified once they are approved or if revisions are needed. The admin has 14 working days to complete the review.
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>Coordinates Rejected - Revision Required</strong>
            <br />
            {coordinateReviewRemarks && (
              <span className="block mt-1">
                <strong>Remarks:</strong> {coordinateReviewRemarks}
              </span>
            )}
            <span className="block mt-1">
              Please update your coordinates based on the feedback above and resubmit. You have 14 working days to make the required changes.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800 text-sm">
            <strong>Coordinates Approved</strong>
            <br />
            Your project coordinates have been verified. You can now proceed with the rest of your application.
          </AlertDescription>
        </Alert>
      )}

      {/* Important Notice */}
      {!isPendingApproval && !isApproved && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>Important:</strong> You must submit your project coordinates for admin approval before you can proceed with the rest of your application. The admin will verify that your project area does not overlap with existing approved projects.
          </AlertDescription>
        </Alert>
      )}

      <form onChange={handleChange} className="space-y-6">
        {/* Coordinate Points */}
        {[1, 2, 3, 4].map((pointNum) => (
          <div key={pointNum} className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold text-gray-800">
                Point {pointNum}
              </Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
              <div className="space-y-1">
                <Label
                  htmlFor={`point${pointNum}-lat`}
                  className="text-xs font-medium text-gray-600"
                >
                  Latitude
                </Label>
                <Input
                  id={`point${pointNum}-lat`}
                  placeholder="e.g., 14.5995"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isReadOnly || isPendingApproval}
                  {...register(`projectCoordinates.point${pointNum}.latitude` as any)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`point${pointNum}-lng`}
                  className="text-xs font-medium text-gray-600"
                >
                  Longitude
                </Label>
                <Input
                  id={`point${pointNum}-lng`}
                  placeholder="e.g., 120.9842"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isReadOnly || isPendingApproval}
                  {...register(`projectCoordinates.point${pointNum}.longitude` as any)}
                />
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500 mt-4">
          Enter coordinates in decimal degrees format. These 4 points should form the boundary of your project area.
        </p>
      </form>
    </div>
  )
}
