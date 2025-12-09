import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Initialize other documents for an application
 * POST /api/otherDocuments/initialize
 *
 * Creates 5 OtherDocument records when all acceptance requirements are accepted.
 * This endpoint is idempotent - calling it multiple times won't create duplicates.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 })
    }

    // Get application and verify ownership
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application || application.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Verify all acceptance requirements are accepted
    const acceptanceReqs = await prisma.acceptanceRequirement.findMany({
      where: { applicationId },
    })

    const allAccepted = acceptanceReqs.length > 0 &&
                        acceptanceReqs.every(req => req.status === "ACCEPTED")

    if (!allAccepted) {
      return NextResponse.json({
        error: "All Acceptance Requirements must be accepted first",
      }, { status: 400 })
    }

    // Check if already initialized (idempotent)
    const existing = await prisma.otherDocument.findFirst({
      where: { applicationId }
    })

    if (existing) {
      return NextResponse.json({ error: "Already initialized" }, { status: 409 })
    }

    // Create other documents
    const docTypes = [
      { type: "ECC", name: "Environmental Compliance Certificate" },
      { type: "LGU_ENDORSEMENT", name: "LGU Endorsement" },
      { type: "COMMUNITY_CONSENT", name: "Community Consent" },
      { type: "ANCESTRAL_DOMAIN_CLEARANCE", name: "Ancestral Domain Clearance" },
      { type: "BUSINESS_PERMIT", name: "Business Permit" },
    ]

    const docs = await prisma.$transaction(
      docTypes.map((doc) =>
        prisma.otherDocument.create({
          data: {
            applicationId,
            documentType: doc.type,
            documentName: doc.name,
            status: "PENDING_SUBMISSION",
          },
        })
      )
    )

    // Update application status if not already set
    if (application.status !== "PENDING_OTHER_DOCUMENTS") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "PENDING_OTHER_DOCUMENTS" },
      })
    }

    return NextResponse.json({
      message: "Initialized successfully",
      totalDocuments: docs.length,
    }, { status: 201 })
  } catch (error) {
    console.error("Initialize error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
