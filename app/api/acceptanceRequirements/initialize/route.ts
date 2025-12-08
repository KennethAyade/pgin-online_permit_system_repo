import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS } from "@/lib/constants"

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
      include: {
        user: true,
      }
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

    // Check if application is in a state that can initialize acceptance requirements
    // Block in the following cases:
    // - COORDINATE_REVISION_REQUIRED: coordinates need revision
    // - DRAFT without approved coordinates: wizard not far enough yet
    //
    // NOTE: We allow initialization in OVERLAP_DETECTED_PENDING_CONSENT so that
    // applicants can proceed with Acceptance Requirements while overlap consent
    // is being handled in parallel.
    const isCoordinateRevisionRequired = application.status === "COORDINATE_REVISION_REQUIRED"
    const isDraftWithoutApprovedCoordinates =
      application.status === "DRAFT" &&
      !application.coordinateApprovedAt &&
      !application.coordinateAutoApproved

    if (isCoordinateRevisionRequired || isDraftWithoutApprovedCoordinates) {
      return NextResponse.json(
        {
          error: `Cannot initialize acceptance requirements. Application status: ${application.status}`,
          requiresAction: isCoordinateRevisionRequired
            ? "Please revise your coordinates based on admin feedback"
            : "Please complete all wizard steps first (including coordinate approval)"
        },
        { status: 400 }
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

    // Get uploaded documents from JSON field (batch uploaded during wizard)
    const uploadedDocumentsJson = (application.uploadedDocuments as Record<string, {fileUrl: string, fileName: string}>) || {}

    // Create acceptance requirements with batch upload support
    // PROJECT_COORDINATES (order 1) is pre-accepted since it was approved during wizard phase
    // Other requirements: if document uploaded, set to PENDING_REVIEW; otherwise PENDING_SUBMISSION
    const requirementsData = requirements.map((req) => {
      const uploadedDoc = uploadedDocumentsJson[req.type]
      const isCoordinates = req.type === "PROJECT_COORDINATES"
      const hasUploadedFile = !!uploadedDoc

      // Base data
      const baseData = {
        applicationId,
        requirementType: req.type as any,
        requirementName: req.name,
        requirementDescription: req.description,
        order: req.order,
      }

      // For coordinates (pre-accepted)
      if (isCoordinates) {
        return {
          ...baseData,
          status: "ACCEPTED" as any,
          submittedAt: application.coordinateApprovedAt || new Date(),
          reviewedAt: application.coordinateApprovedAt || new Date(),
          adminRemarks: "Pre-approved during application wizard phase",
          submittedData: JSON.stringify(application.projectCoordinates),
        }
      }

      // For documents that were uploaded during wizard (batch upload)
      if (hasUploadedFile) {
        return {
          ...baseData,
          status: "PENDING_REVIEW" as any,
          submittedAt: new Date(),
          submittedBy: session.user.id,
          submittedFileUrl: uploadedDoc.fileUrl,
          submittedFileName: uploadedDoc.fileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        }
      }

      // For documents not uploaded yet
      return {
        ...baseData,
        status: "PENDING_SUBMISSION" as any,
      }
    })

    // Create all requirements in a transaction
    await prisma.$transaction(
      requirementsData.map((data) =>
        prisma.acceptanceRequirement.create({ data })
      )
    )

    // Update application with acceptance requirements started
    // For DRAFT / COORDINATE_AUTO_APPROVED we move to ACCEPTANCE_IN_PROGRESS.
    // For overlap / other statuses, keep current status to avoid clobbering
    // coordinate/consent workflows.
    let newStatus = application.status
    if (
      application.status === "DRAFT" ||
      application.status === "COORDINATE_AUTO_APPROVED"
    ) {
      newStatus = "ACCEPTANCE_IN_PROGRESS"
    }

    const updateData: any = {
      acceptanceRequirementsStartedAt: new Date(),
    }
    if (newStatus !== application.status) {
      updateData.status = newStatus
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
    })

    // Create notifications for each PENDING_REVIEW requirement
    const pendingReviewCount = requirementsData.filter(r => r.status === "PENDING_REVIEW").length

    if (pendingReviewCount > 0) {
      // Notify applicant
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          applicationId,
          type: "REQUIREMENT_PENDING_REVIEW",
          title: "Requirements Submitted for Review",
          message: `${pendingReviewCount} acceptance requirement(s) have been submitted for admin review.`,
          link: `/applications/${applicationId}`,
        },
      })
    }

    return NextResponse.json(
      {
        message: "Acceptance requirements initialized successfully",
        totalRequirements: requirementsData.length,
        pendingReview: pendingReviewCount,
        pendingSubmission: requirementsData.filter(r => r.status === "PENDING_SUBMISSION").length,
        accepted: requirementsData.filter(r => r.status === "ACCEPTED").length,
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
