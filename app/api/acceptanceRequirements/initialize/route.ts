import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Initialize acceptance requirements for an application based on permit type
 * POST /api/acceptanceRequirements/initialize
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      )
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Verify ownership
    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Check if requirements already initialized
    const existingRequirements = await prisma.acceptanceRequirement.findFirst({
      where: { applicationId }
    })

    if (existingRequirements) {
      return NextResponse.json(
        { error: "Acceptance requirements already initialized for this application" },
        { status: 409 }
      )
    }

    // Define requirements based on permit type
    const requirementsByType = {
      ISAG: [
        {
          order: 1,
          type: "PROJECT_COORDINATES",
          name: "Project Coordinates",
          description: "Enter your project coordinates for verification",
        },
        {
          order: 2,
          type: "APPLICATION_FORM",
          name: "Duly Accomplished Application Form (MGB Form 8-4)",
          description: "Upload signed and accomplished application form",
        },
        {
          order: 3,
          type: "SURVEY_PLAN",
          name: "Survey Plan (signed and sealed by deputized Geodetic Engineer)",
          description: "Upload survey plan signed and sealed by deputized Geodetic Engineer",
        },
        {
          order: 4,
          type: "LOCATION_MAP",
          name: "Location Map (NAMRIA Topographic Map 1:50,000)",
          description: "Upload NAMRIA Topographic Map 1:50,000",
        },
        {
          order: 5,
          type: "WORK_PROGRAM",
          name: "Five-Year Work Program (MGB Form 6-2)",
          description: "Upload five-year work program",
        },
        {
          order: 6,
          type: "IEE_REPORT",
          name: "Initial Environmental Examination (IEE) Report",
          description: "Upload IEE report",
        },
        {
          order: 7,
          type: "EPEP",
          name: "Certificate of Environmental Management and Community Relations Record",
          description: "Upload EPEP certificate",
        },
        {
          order: 8,
          type: "PROOF_TECHNICAL_COMPETENCE",
          name: "Proof of Technical Competence (CVs, licenses, track records)",
          description: "Upload CVs, licenses, and track records",
        },
        {
          order: 9,
          type: "PROOF_FINANCIAL_CAPABILITY",
          name: "Proof of Financial Capability (Statement of Assets & Liabilities, FS, ITR, etc. / For individual or for corporation)",
          description: "Upload Statement of Assets & Liabilities, Financial Statements, ITR for individual or corporation",
        },
        {
          order: 10,
          type: "ARTICLES_INCORPORATION",
          name: "Articles of Incorporation/Partnership (SEC Certified, if applicable)",
          description: "Upload SEC Certified articles (if applicable)",
        },
        {
          order: 11,
          type: "OTHER_SUPPORTING_PAPERS",
          name: "Other Supporting Papers required by MGB/PMRB",
          description: "Upload any other documents required by MGB/PMRB",
        },
      ],
      CSAG: [
        {
          order: 1,
          type: "PROJECT_COORDINATES",
          name: "Project Coordinates",
          description: "Enter your project coordinates for verification",
        },
        {
          order: 2,
          type: "APPLICATION_FORM",
          name: "Duly Accomplished Application Form (MGB Form 8-4)",
          description: "Upload signed and accomplished application form",
        },
        {
          order: 3,
          type: "SURVEY_PLAN",
          name: "Survey Plan",
          description: "Upload survey plan",
        },
        {
          order: 4,
          type: "LOCATION_MAP",
          name: "Location Map",
          description: "Upload location map",
        },
        {
          order: 5,
          type: "WORK_PROGRAM",
          name: "One-Year Work Program (MGB Form 6-2)",
          description: "Upload one-year work program",
        },
        {
          order: 6,
          type: "IEE_REPORT",
          name: "Initial Environmental Examination (IEE) Report",
          description: "Upload IEE report",
        },
        {
          order: 7,
          type: "PROOF_TECHNICAL_COMPETENCE",
          name: "Proof of Technical Competence (CVs, licenses, track records)",
          description: "Upload CVs, licenses, and track records",
        },
        {
          order: 8,
          type: "PROOF_FINANCIAL_CAPABILITY",
          name: "Proof of Technical and Financial Capability (Statement of Assets & Liabilities, FS, ITR, etc. / For individual or for corporation)",
          description: "Upload Statement of Assets & Liabilities, Financial Statements, ITR for individual or corporation",
        },
        {
          order: 9,
          type: "ARTICLES_INCORPORATION",
          name: "Articles of Incorporation/Partnership (SEC Certified, if applicable)",
          description: "Upload SEC Certified articles (if applicable)",
        },
        {
          order: 10,
          type: "OTHER_SUPPORTING_PAPERS",
          name: "Other Supporting Papers required by MGB/PMRB",
          description: "Upload any other documents required by MGB/PMRB",
        },
      ],
    }

    const requirements = requirementsByType[application.permitType as keyof typeof requirementsByType]

    if (!requirements) {
      return NextResponse.json(
        { error: "Invalid permit type" },
        { status: 400 }
      )
    }

    // Create acceptance requirements
    const createdRequirements = await prisma.acceptanceRequirement.createMany({
      data: requirements.map((req) => ({
        applicationId,
        requirementType: req.type as any,
        requirementName: req.name,
        requirementDescription: req.description,
        order: req.order,
        status: "PENDING_SUBMISSION",
      })),
    })

    // Get the first requirement (Project Coordinates)
    const firstRequirement = await prisma.acceptanceRequirement.findFirst({
      where: { applicationId, order: 1 },
    })

    // Update application with acceptance requirements started
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        acceptanceRequirementsStartedAt: new Date(),
        currentAcceptanceRequirementId: firstRequirement?.id,
      },
    })

    return NextResponse.json(
      {
        message: "Acceptance requirements initialized successfully",
        count: createdRequirements.count,
        firstRequirement,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Initialization error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
