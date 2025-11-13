import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "./constants"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"

export interface UploadResult {
  success: boolean
  fileName?: string
  fileUrl?: string
  error?: string
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

    // Create directory structure: storage/uploads/{applicationId}/
    const uploadDir = join(process.cwd(), "storage", "uploads", applicationId)
    await mkdir(uploadDir, { recursive: true })

    // Generate secure filename: {applicationId}_{documentType}_{timestamp}_{version}.pdf
    const timestamp = Date.now()
    const randomSuffix = randomBytes(4).toString("hex")
    const fileName = `${applicationId}_${documentType}_${timestamp}_${version}_${randomSuffix}.pdf`
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
      fileUrl
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

