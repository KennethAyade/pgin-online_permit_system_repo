import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

/**
 * Get all acceptance requirements for an application
 * GET /api/acceptanceRequirements/[id]
 * Query params: ?applicationType=user|admin
 */

export async function GET(
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

    const { id } = await params
    const applicationId = id
    const applicationType = request.nextUrl.searchParams.get("type") || "user"

    // Get application
    let application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        acceptanceRequirements: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // --- Sync existing requirements from uploadedDocuments if needed ---
    const uploadedDocumentsJson = (application.uploadedDocuments as Record<string, {fileUrl: string, fileName: string}>) || {}

    if (application.acceptanceRequirements.length > 0 && Object.keys(uploadedDocumentsJson).length > 0) {
      const updates = [] as Parameters<typeof prisma.acceptanceRequirement.update>[]
      const now = new Date()

      for (const req of application.acceptanceRequirements) {
        if (
          req.status === "PENDING_SUBMISSION" &&
          !req.submittedFileUrl &&
          uploadedDocumentsJson[req.requirementType as keyof typeof uploadedDocumentsJson]
        ) {
          const uploadedDoc = uploadedDocumentsJson[req.requirementType as keyof typeof uploadedDocumentsJson]!
          updates.push([
            {
              where: { id: req.id },
              data: {
                status: "PENDING_REVIEW" as any,
                submittedAt: now,
                submittedBy: application.userId,
                submittedFileUrl: uploadedDoc.fileUrl,
                submittedFileName: uploadedDoc.fileName,
                autoAcceptDeadline: addWorkingDays(now, ADMIN_REVIEW_DEADLINE_DAYS),
              },
            },
          ] as any)
        }
      }

      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map((args) => prisma.acceptanceRequirement.update(args[0]))
        )

        // Re-fetch application to include updated requirements
        application = await prisma.application.findUnique({
          where: { id: applicationId },
          include: {
            user: true,
            acceptanceRequirements: {
              orderBy: { order: "asc" },
            },
          },
        }) as typeof application

        if (!application) {
          return NextResponse.json(
            { error: "Application not found" },
            { status: 404 }
          )
        }
      }
    }

    // Verify authorization
    if (applicationType === "user" && application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    if (applicationType === "admin") {
      const adminUser = await prisma.adminUser.findUnique({
        where: { id: session.user.id },
      })
      if (!adminUser) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      {
        application: {
          id: application.id,
          applicationNo: application.applicationNo,
          projectName: application.projectName,
          permitType: application.permitType,
          status: application.status,
          acceptanceRequirementsStartedAt: application.acceptanceRequirementsStartedAt,
        },
        requirements: application.acceptanceRequirements,
        total: application.acceptanceRequirements.length,
        completed: application.acceptanceRequirements.filter(
          (r) => r.status === "ACCEPTED"
        ).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
