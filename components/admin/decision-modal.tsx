"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react"

interface DecisionModalProps {
  applicationId: string
  action: "approve" | "reject" | "return"
  onSuccess?: () => void
}

export function DecisionModal({ applicationId, action, onSuccess }: DecisionModalProps) {
  const [open, setOpen] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (action === "return" || action === "reject") {
      if (!remarks.trim()) {
        setError("Remarks are required")
        return
      }
    }

    setLoading(true)
    setError("")

    try {
      const endpoint = `/api/admin/applications/${applicationId}/${action}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          action === "approve" ? {} : { reason: remarks, remarks }
        ),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to process request")
        setLoading(false)
        return
      }

      setOpen(false)
      setRemarks("")
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setError("An error occurred")
      setLoading(false)
    }
  }

  const actionConfig = {
    approve: {
      title: "Approve Application",
      description: "Are you sure you want to approve this application? This action will generate a permit number.",
      buttonText: "Approve Application",
      icon: CheckCircle2,
      buttonClass: "bg-green-700 hover:bg-green-800 text-white",
    },
    reject: {
      title: "Reject Application",
      description: "Please provide a detailed reason for rejecting this application.",
      buttonText: "Reject Application",
      icon: XCircle,
      buttonClass: "bg-red-700 hover:bg-red-800 text-white",
    },
    return: {
      title: "Return Application",
      description: "Please provide specific remarks for returning this application to the applicant.",
      buttonText: "Return Application",
      icon: ArrowLeft,
      buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
  }

  const config = actionConfig[action]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={config.buttonClass}
        >
          <config.icon className="h-4 w-4 mr-2" />
          {config.buttonText.split(' ')[0]}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">{config.title}</DialogTitle>
          <DialogDescription className="text-gray-600">{config.description}</DialogDescription>
        </DialogHeader>

        {(action === "return" || action === "reject") && (
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
              Remarks <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="remarks"
              placeholder="Enter detailed remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={5}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">This will be sent to the applicant</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={config.buttonClass}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              config.buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
