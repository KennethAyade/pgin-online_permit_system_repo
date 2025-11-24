import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "./constants"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"

// Try to import Vercel Blob (optional - only available in production)
let put: any = null
let del: any = null
try {
  const blob = require("@vercel/blob")
  put = blob.put
  del = blob.del
} catch {
  // @vercel/blob not installed or not available
}

export interface UploadResult {
  success: boolean
  fileName?: string
  fileUrl?: string
  error?: string
  isBlob?: boolean // Indicates if file is stored in Vercel Blob
}

export async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only PDF files are allowed"
    }
  }

  return { valid: true }
}

export async function saveFile(
  file: File,
  applicationId: string,
  documentType: string,
  version: number = 1
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = await validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate secure filename: {applicationId}_{documentType}_{timestamp}_{version}.pdf
    const timestamp = Date.now()
    const randomSuffix = randomBytes(4).toString("hex")
    const fileName = `${applicationId}_${documentType}_${timestamp}_${version}_${randomSuffix}.pdf`

    // Use Vercel Blob Storage if available (production) and token is set
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (put && blobToken) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        const blob = await put(`documents/${applicationId}/${fileName}`, buffer, {
          access: "public",
          contentType: file.type,
        })

        return {
          success: true,
          fileName: file.name,
          fileUrl: blob.url,
          isBlob: true
        }
      } catch (blobError) {
        console.error("Error uploading to Vercel Blob, falling back to local storage:", blobError)
        // Fall through to local storage
      }
    }

    // Fallback to local filesystem (development)
    const uploadDir = join(process.cwd(), "storage", "uploads", applicationId)
    await mkdir(uploadDir, { recursive: true })
    const filePath = join(uploadDir, fileName)

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return relative path for database storage
    const fileUrl = `storage/uploads/${applicationId}/${fileName}`

    return {
      success: true,
      fileName: file.name,
      fileUrl,
      isBlob: false
    }
  } catch (error) {
    console.error("Error saving file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save file"
    }
  }
}

export async function deleteFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if it's a Vercel Blob URL
    if (fileUrl.startsWith("https://") && del && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(fileUrl)
        return { success: true }
      } catch (blobError) {
        console.error("Error deleting from Vercel Blob:", blobError)
        // Fall through to local file deletion
      }
    }

    // Fallback to local filesystem deletion
    const filePath = join(process.cwd(), fileUrl)
    await unlink(filePath)
    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file"
    }
  }
}

export function getFileUrl(fileUrl: string): string {
  // Return URL path for file access through API
  // Files are served through /api/documents/[id] route
  return fileUrl
}

