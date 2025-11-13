"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, File, Loader2, CheckCircle2, Download } from "lucide-react"
import { MAX_FILE_SIZE } from "@/lib/constants"

interface DocumentUploadProps {
  applicationId: string
  documentType: string
  documentName: string
  setNumber?: number
  onUploadSuccess?: () => void
  existingDocument?: {
    id: string
    fileName: string
    fileUrl: string
    version: number
  }
}

export function DocumentUpload({
  applicationId,
  documentType,
  documentName,
  setNumber,
  onUploadSuccess,
  existingDocument,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploading(true)
      setError("")
      setSuccess(false)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("applicationId", applicationId)
        formData.append("documentType", documentType)
        formData.append("documentName", documentName)
        if (setNumber) {
          formData.append("setNumber", setNumber.toString())
        }

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Upload failed")
          setUploading(false)
          return
        }

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } catch (error) {
        setError("An error occurred during upload")
      } finally {
        setUploading(false)
      }
    },
    [applicationId, documentType, documentName, setNumber, onUploadSuccess]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const handleDelete = async () => {
    if (!existingDocument) return

    try {
      const response = await fetch(`/api/documents/${existingDocument.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setError("Failed to delete document")
        return
      }

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error) {
      setError("An error occurred during deletion")
    }
  }

  const handleDownload = () => {
    if (!existingDocument) return
    window.open(`/api/documents/${existingDocument.id}`, "_blank")
  }

  return (
    <div className="space-y-3">
      {existingDocument ? (
        <div className="flex items-center justify-between p-4 bg-white border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{existingDocument.fileName}</p>
              <p className="text-xs text-gray-500">Version {existingDocument.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragActive
              ? "Drop the PDF file here"
              : "Drag & drop a PDF file here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">
            PDF only, max {MAX_FILE_SIZE / 1024 / 1024}MB
          </p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading document...</span>
        </div>
      )}

      {success && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800">Document uploaded successfully</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}
