import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"

// Try to import Vercel Blob (optional - only available in production)
let put: any = null
try {
  const blob = require("@vercel/blob")
  put = blob.put
} catch {
  // @vercel/blob not installed or not available
}

const MAX_CONSENT_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_CONSENT_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

/**
 * Upload Overlap Consent Document
 * Phase 2.4: Upload consent from affected application owner
 * POST /api/applications/[id]/upload-consent
 * Body: FormData with 'file' and 'affectedApplicationId'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: applicationId } = await params

    // Verify application belongs to user
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const affectedApplicationId = formData.get("affectedApplicationId") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!affectedApplicationId) {
      return NextResponse.json(
        { error: "Affected application ID is required" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_CONSENT_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_CONSENT_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_CONSENT_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and image files (PNG, JPG, JPEG) are allowed" },
        { status: 400 }
      )
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop() || 'pdf'

    // Generate secure filename
    const timestamp = Date.now()
    const randomSuffix = randomBytes(4).toString("hex")
    const fileName = `${applicationId}_consent_${affectedApplicationId}_${timestamp}_${randomSuffix}.${fileExtension}`

    let fileUrl: string
    let isBlob = false

    // Use Vercel Blob Storage if available (production)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (put && blobToken) {
      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const blob = await put(`consent/${applicationId}/${fileName}`, buffer, {
          access: "public",
          contentType: file.type,
        })

        fileUrl = blob.url
        isBlob = true
      } catch (blobError) {
        console.error("Error uploading to Vercel Blob, falling back to local storage:", blobError)
        // Fall through to local storage
        fileUrl = await saveToLocalStorage(applicationId, fileName, file)
      }
    } else {
      // Fallback to local filesystem (development)
      fileUrl = await saveToLocalStorage(applicationId, fileName, file)
    }

    // Find or create OverlapConsent record
    // First, we need to find the coordinate history records for both applications
    const newCoordinateHistory = await prisma.coordinateHistory.findFirst({
      where: {
        applicationId: applicationId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const affectedCoordinateHistory = await prisma.coordinateHistory.findFirst({
      where: {
        applicationId: affectedApplicationId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!newCoordinateHistory || !affectedCoordinateHistory) {
      return NextResponse.json(
        { error: "Coordinate history not found for one or both applications" },
        { status: 404 }
      )
    }

    // Check if overlap consent already exists
    const existingConsent = await prisma.overlapConsent.findFirst({
      where: {
        newApplicationId: applicationId,
        affectedApplicationId: affectedApplicationId,
      },
    })

    let overlapConsent

    if (existingConsent) {
      // Update existing consent
      overlapConsent = await prisma.overlapConsent.update({
        where: { id: existingConsent.id },
        data: {
          consentFileUrl: fileUrl,
          consentFileName: file.name,
          consentStatus: "UPLOADED",
          consentUploadedAt: new Date(),
          consentUploadedBy: session.user.id,
          // Clear any previous verification
          consentVerifiedAt: null,
          consentVerifiedBy: null,
          verificationRemarks: null,
        },
      })
    } else {
      // Create new consent record
      // Note: We need overlap data (percentage, area, GeoJSON) from the overlap detection
      // For now, we'll create a basic record and the overlap data should be populated
      // when coordinates are initially checked
      overlapConsent = await prisma.overlapConsent.create({
        data: {
          newApplicationId: applicationId,
          newCoordinateHistoryId: newCoordinateHistory.id,
          affectedApplicationId: affectedApplicationId,
          affectedCoordinateHistoryId: affectedCoordinateHistory.id,
          overlapPercentage: 0, // This should be populated from overlap check
          consentFileUrl: fileUrl,
          consentFileName: file.name,
          consentStatus: "UPLOADED",
          consentUploadedAt: new Date(),
          consentUploadedBy: session.user.id,
        },
      })
    }

    // Create notification for admin to verify consent
    const adminUsers = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    await prisma.notification.createMany({
      data: adminUsers.map(admin => ({
        adminUserId: admin.id,
        applicationId: applicationId,
        type: "CONSENT_UPLOADED",
        title: "Consent Document Uploaded",
        message: `Application ${application.applicationNo} has uploaded a consent document for overlap with Application ${affectedApplicationId}. Please verify the document.`,
        link: `/admin/applications/${applicationId}`,
      })),
    })

    return NextResponse.json(
      {
        success: true,
        overlapConsent,
        message: "Consent document uploaded successfully. Pending admin verification.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error uploading consent:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Helper function to save file to local storage
 */
async function saveToLocalStorage(
  applicationId: string,
  fileName: string,
  file: File
): Promise<string> {
  const uploadDir = join(process.cwd(), "storage", "consent", applicationId)
  await mkdir(uploadDir, { recursive: true })
  const filePath = join(uploadDir, fileName)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  return `storage/consent/${applicationId}/${fileName}`
}
