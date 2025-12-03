import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Verify or Reject Overlap Consent Document
 * Phase 2.4: Admin endpoint to verify/reject consent documents
 * POST /api/admin/consents/[id]/verify
 * Body: {
 *   decision: "VERIFIED" | "REJECTED",
 *   remarks?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin access
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { id: consentId } = await params
    const body = await request.json()
    const { decision, remarks } = body

    if (!decision || !["VERIFIED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be VERIFIED or REJECTED" },
        { status: 400 }
      )
    }

    // Get the consent record
    const consent = await prisma.overlapConsent.findUnique({
      where: { id: consentId },
      include: {
        newApplication: {
          select: {
            id: true,
            applicationNo: true,
            userId: true,
          },
        },
        affectedApplication: {
          select: {
            applicationNo: true,
          },
        },
      },
    })

    if (!consent) {
      return NextResponse.json(
        { error: "Consent record not found" },
        { status: 404 }
      )
    }

    // Verify consent has been uploaded
    if (consent.consentStatus !== "UPLOADED") {
      return NextResponse.json(
        {
          error: `Consent cannot be verified. Current status: ${consent.consentStatus}`,
        },
        { status: 400 }
      )
    }

    // Update consent record
    const updatedConsent = await prisma.overlapConsent.update({
      where: { id: consentId },
      data: {
        consentStatus: decision,
        consentVerifiedAt: new Date(),
        consentVerifiedBy: adminUser.id,
        verificationRemarks: remarks || null,
      },
    })

    // Create notification for applicant
    let notificationTitle: string
    let notificationMessage: string
    let notificationType: string

    if (decision === "VERIFIED") {
      notificationTitle = "Consent Document Verified"
      notificationMessage = `Your consent document for overlap with Application ${consent.affectedApplication.applicationNo} has been verified by the admin.`
      notificationType = "CONSENT_VERIFIED"
    } else {
      notificationTitle = "Consent Document Rejected"
      notificationMessage = `Your consent document for overlap with Application ${consent.affectedApplication.applicationNo} has been rejected. ${remarks ? `Reason: ${remarks}` : "Please upload a valid consent document."}`
      notificationType = "CONSENT_REJECTED"
    }

    await prisma.notification.create({
      data: {
        userId: consent.newApplication.userId,
        applicationId: consent.newApplication.id,
        type: notificationType as any,
        title: notificationTitle,
        message: notificationMessage,
        link: `/applications/${consent.newApplication.id}`,
      },
    })

    // Check if all consents for this application are verified
    const allConsents = await prisma.overlapConsent.findMany({
      where: {
        newApplicationId: consent.newApplication.id,
      },
    })

    const allVerified = allConsents.every(c => c.consentStatus === "VERIFIED")
    const anyRejected = allConsents.some(c => c.consentStatus === "REJECTED")

    return NextResponse.json(
      {
        success: true,
        consent: updatedConsent,
        message: decision === "VERIFIED"
          ? "Consent document verified successfully"
          : "Consent document rejected",
        applicationConsentStatus: {
          allVerified,
          anyRejected,
          totalConsents: allConsents.length,
          verifiedCount: allConsents.filter(c => c.consentStatus === "VERIFIED").length,
          rejectedCount: allConsents.filter(c => c.consentStatus === "REJECTED").length,
          pendingCount: allConsents.filter(c => c.consentStatus === "UPLOADED").length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error verifying consent:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Get Overlap Consent Details
 * GET /api/admin/consents/[id]/verify
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify admin access
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const { id: consentId } = await params

    const consent = await prisma.overlapConsent.findUnique({
      where: { id: consentId },
      include: {
        newApplication: {
          select: {
            id: true,
            applicationNo: true,
            projectName: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        affectedApplication: {
          select: {
            id: true,
            applicationNo: true,
            projectName: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        newCoordinateHistory: {
          select: {
            coordinates: true,
            pointCount: true,
          },
        },
        affectedCoordinateHistory: {
          select: {
            coordinates: true,
            pointCount: true,
          },
        },
      },
    })

    if (!consent) {
      return NextResponse.json(
        { error: "Consent record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        consent,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching consent details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
