'use client'

/**
 * FileUploadList Component
 * Phase 3.2: Reusable simple list-style file upload component
 * Extracted from registration form design
 */

import { Label } from '@/components/ui/label'
import { Upload, FileCheck, X } from 'lucide-react'

export interface FileUploadItem {
  id: string
  label: string
  required?: boolean
  acceptedFileTypes?: string
  file?: File | null
  existingFileUrl?: string
  existingFileName?: string
  disabled?: boolean
}

interface FileUploadListProps {
  items: FileUploadItem[]
  onFileChange: (id: string, file: File | null) => void
  onFileRemove?: (id: string) => void
}

export function FileUploadList({
  items,
  onFileChange,
  onFileRemove,
}: FileUploadListProps) {
  const handleFileChange = (id: string, files: FileList | null) => {
    if (files && files.length > 0) {
      onFileChange(id, files[0])
    }
  }

  const handleRemoveFile = (id: string) => {
    onFileChange(id, null)
    if (onFileRemove) {
      onFileRemove(id)
    }
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between py-3 border-b"
        >
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Show selected file */}
            {item.file && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  {item.file.name}
                </p>
                {!item.disabled && onFileRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Show existing file from server */}
            {!item.file && item.existingFileUrl && item.existingFileName && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                {item.existingFileName}
              </p>
            )}
          </div>

          {/* Upload button */}
          <div className="ml-4">
            <input
              type="file"
              id={item.id}
              accept={item.acceptedFileTypes || '.pdf'}
              className="hidden"
              onChange={(e) => handleFileChange(item.id, e.target.files)}
              disabled={item.disabled}
            />
            <label
              htmlFor={item.id}
              className={`cursor-pointer px-4 py-2 text-white text-sm rounded inline-flex items-center gap-2 ${
                item.disabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              {item.file || (item.existingFileUrl && item.existingFileName)
                ? 'Replace File'
                : 'Choose File'}
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}
