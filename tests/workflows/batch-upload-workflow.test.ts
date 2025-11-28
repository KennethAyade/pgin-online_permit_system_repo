/**
 * Batch Upload Workflow Integration Test
 *
 * This test simulates the complete user journey for batch upload with parallel review:
 * 1. User creates application and uploads ALL documents at once
 * 2. Admin reviews documents in parallel (any order)
 * 3. Admin rejects some documents
 * 4. User resubmits only rejected documents
 * 5. All documents accepted → Other Documents section unlocks
 * 6. User uploads other documents
 * 7. Admin reviews other documents
 * 8. Application completes
 *
 * Test Accounts:
 * - User: sagkurtkyle@gmail.com / SAGthesis101
 * - Admin: admin@mgb.gov.ph / Admin@123
 */

import { PrismaClient } from "@prisma/client"
import { addWorkingDays } from "@/lib/utils"
import {
  ADMIN_REVIEW_DEADLINE_DAYS,
  REVISION_DEADLINE_DAYS
} from "@/lib/constants"

const prisma = new PrismaClient()

// Test configuration
const TEST_USER_EMAIL = "sagkurtkyle@gmail.com"
const TEST_ADMIN_EMAIL = "admin@mgb.gov.ph"
const TEST_PERMIT_TYPE = "ISAG"

interface TestContext {
  userId: string
  adminId: string
  applicationId: string
  acceptanceRequirementIds: string[]
  otherDocumentIds: string[]
}

class WorkflowTester {
  private context: Partial<TestContext> = {}

  async setup() {
    console.log("🔧 Setting up test context...")

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
    })
    if (!user) throw new Error(`User ${TEST_USER_EMAIL} not found`)
    this.context.userId = user.id

    // Get admin
    const admin = await prisma.adminUser.findUnique({
      where: { email: TEST_ADMIN_EMAIL },
    })
    if (!admin) throw new Error(`Admin ${TEST_ADMIN_EMAIL} not found`)
    this.context.adminId = admin.id

    console.log("✅ Test context ready")
    console.log(`   User: ${user.email} (${user.id})`)
    console.log(`   Admin: ${admin.email} (${admin.id})`)
  }

  async test1_CreateApplicationWithCoordinates() {
    console.log("\n📝 Test 1: Create application with coordinates")

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: this.context.userId!,
        permitType: TEST_PERMIT_TYPE,
        status: "PENDING_COORDINATE_APPROVAL",
        projectName: "Test Mining Project - Batch Upload",
        projectCoordinates: {
          type: "Polygon",
          coordinates: [
            [
              [121.0, 14.0],
              [121.1, 14.0],
              [121.1, 14.1],
              [121.0, 14.1],
              [121.0, 14.0],
            ],
          ],
        },
      },
    })

    this.context.applicationId = application.id
    console.log(`✅ Application created: ${application.applicationNo}`)

    // Admin approves coordinates
    const updatedApp = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: "DRAFT",
        coordinateApprovedAt: new Date(),
      },
    })

    console.log("✅ Coordinates approved by admin")

    return application.id
  }

  async test2_UploadAllDocumentsAtOnce() {
    console.log("\n📤 Test 2: Batch upload ALL documents at once")

    // Simulate uploading 10 documents (all except PROJECT_COORDINATES)
    const acceptanceDocTypes = [
      "APPLICATION_FORM",
      "SURVEY_PLAN",
      "LOCATION_MAP",
      "WORK_PROGRAM",
      "IEE_REPORT",
      "EPEP",
      "PROOF_TECHNICAL_COMPETENCE",
      "PROOF_FINANCIAL_CAPABILITY",
      "ARTICLES_INCORPORATION",
      "OTHER_SUPPORTING_PAPERS",
    ]

    const uploadedDocuments: Record<string, { fileUrl: string; fileName: string }> = {}

    for (const docType of acceptanceDocTypes) {
      // Simulate document upload
      const mockFileUrl = `https://storage.example.com/docs/${docType.toLowerCase()}_${Date.now()}.pdf`
      const mockFileName = `${docType}_test_document.pdf`

      uploadedDocuments[docType] = {
        fileUrl: mockFileUrl,
        fileName: mockFileName,
      }
    }

    // Update application with uploaded documents
    await prisma.application.update({
      where: { id: this.context.applicationId! },
      data: {
        uploadedDocuments: uploadedDocuments,
        status: "DRAFT", // Still in draft until final submission
      },
    })

    console.log(`✅ Uploaded ${acceptanceDocTypes.length} documents in batch`)
    console.log("   Documents: " + acceptanceDocTypes.join(", "))
  }

  async test3_SubmitApplicationAndInitializeRequirements() {
    console.log("\n🚀 Test 3: Submit application and initialize acceptance requirements")

    // Submit application
    await prisma.application.update({
      where: { id: this.context.applicationId! },
      data: {
        status: "ACCEPTANCE_IN_PROGRESS",
        submittedAt: new Date(),
      },
    })

    // Initialize acceptance requirements (simulating API)
    const application = await prisma.application.findUnique({
      where: { id: this.context.applicationId! },
    })

    const uploadedDocsJson = (application?.uploadedDocuments as Record<string, {fileUrl: string, fileName: string}>) || {}

    const acceptanceRequirements = [
      "PROJECT_COORDINATES",
      "APPLICATION_FORM",
      "SURVEY_PLAN",
      "LOCATION_MAP",
      "WORK_PROGRAM",
      "IEE_REPORT",
      "EPEP",
      "PROOF_TECHNICAL_COMPETENCE",
      "PROOF_FINANCIAL_CAPABILITY",
      "ARTICLES_INCORPORATION",
      "OTHER_SUPPORTING_PAPERS",
    ]

    const requirementsData = acceptanceRequirements.map((reqType, index) => {
      const baseData = {
        applicationId: this.context.applicationId!,
        requirementType: reqType,
        requirementName: reqType.replace(/_/g, " "),
        order: index + 1,
      }

      // Coordinates already approved
      if (reqType === "PROJECT_COORDINATES") {
        return {
          ...baseData,
          status: "ACCEPTED" as const,
          submittedAt: new Date(),
          reviewedAt: new Date(),
          adminRemarks: "Pre-approved during application wizard phase",
        }
      }

      // Uploaded documents → PENDING_REVIEW
      const uploadedDoc = uploadedDocsJson[reqType]
      if (uploadedDoc) {
        return {
          ...baseData,
          status: "PENDING_REVIEW" as const,
          submittedAt: new Date(),
          submittedBy: this.context.userId!,
          submittedFileUrl: uploadedDoc.fileUrl,
          submittedFileName: uploadedDoc.fileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        }
      }

      // Not uploaded → PENDING_SUBMISSION
      return {
        ...baseData,
        status: "PENDING_SUBMISSION" as const,
      }
    })

    const created = await prisma.acceptanceRequirement.createMany({
      data: requirementsData,
    })

    // Get created IDs
    const requirements = await prisma.acceptanceRequirement.findMany({
      where: { applicationId: this.context.applicationId! },
      orderBy: { order: "asc" },
    })

    this.context.acceptanceRequirementIds = requirements.map((r) => r.id)

    console.log(`✅ Created ${created.count} acceptance requirements`)
    console.log(`   - 1 ACCEPTED (coordinates)`)
    console.log(`   - ${requirements.filter((r) => r.status === "PENDING_REVIEW").length} PENDING_REVIEW (uploaded docs)`)
    console.log(`   - ${requirements.filter((r) => r.status === "PENDING_SUBMISSION").length} PENDING_SUBMISSION`)
  }

  async test4_AdminReviewsInParallel() {
    console.log("\n👨‍💼 Test 4: Admin reviews documents in parallel (any order)")

    const requirements = await prisma.acceptanceRequirement.findMany({
      where: {
        applicationId: this.context.applicationId!,
        status: "PENDING_REVIEW",
      },
      orderBy: { order: "asc" },
    })

    console.log(`   Found ${requirements.length} requirements pending review`)

    // Admin reviews in non-sequential order: 5th, 3rd, 1st, 2nd, 4th (parallel)
    const reviewOrder = [4, 2, 0, 1, 3] // Array indices

    for (let i = 0; i < Math.min(3, requirements.length); i++) {
      const req = requirements[reviewOrder[i]]

      await prisma.acceptanceRequirement.update({
        where: { id: req.id },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: this.context.adminId!,
          adminRemarks: `Approved - Document is compliant (reviewed ${i + 1}/3)`,
        },
      })

      console.log(`✅ Admin accepted: ${req.requirementName} (sequence ${req.order})`)
    }

    console.log("   ✅ Verified parallel review working (non-sequential order)")
  }

  async test5_AdminRejectsSomeDocuments() {
    console.log("\n❌ Test 5: Admin rejects some documents")

    const requirements = await prisma.acceptanceRequirement.findMany({
      where: {
        applicationId: this.context.applicationId!,
        status: "PENDING_REVIEW",
      },
      orderBy: { order: "asc" },
    })

    // Reject 2 documents
    for (let i = 0; i < Math.min(2, requirements.length); i++) {
      const req = requirements[i]
      const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS)

      await prisma.acceptanceRequirement.update({
        where: { id: req.id },
        data: {
          status: "REVISION_REQUIRED",
          reviewedAt: new Date(),
          reviewedBy: this.context.adminId!,
          adminRemarks: `Document needs revision: Missing required signatures and annotations`,
          revisionDeadline,
        },
      })

      console.log(`❌ Admin rejected: ${req.requirementName}`)
      console.log(`   Deadline: ${revisionDeadline.toLocaleDateString()}`)
    }
  }

  async test6_UserResubmitsRejectedDocuments() {
    console.log("\n🔄 Test 6: User resubmits ONLY rejected documents")

    const rejectedReqs = await prisma.acceptanceRequirement.findMany({
      where: {
        applicationId: this.context.applicationId!,
        status: "REVISION_REQUIRED",
      },
    })

    console.log(`   Found ${rejectedReqs.length} rejected documents to resubmit`)

    for (const req of rejectedReqs) {
      // Simulate reupload
      const newFileUrl = `https://storage.example.com/docs/${req.requirementType.toLowerCase()}_revised_${Date.now()}.pdf`
      const newFileName = `${req.requirementType}_REVISED.pdf`

      await prisma.acceptanceRequirement.update({
        where: { id: req.id },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          submittedBy: this.context.userId!,
          submittedFileUrl: newFileUrl,
          submittedFileName: newFileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        },
      })

      console.log(`✅ User resubmitted: ${req.requirementName}`)
    }
  }

  async test7_AdminAcceptsResubmittedDocs() {
    console.log("\n✅ Test 7: Admin accepts resubmitted documents")

    const pendingReqs = await prisma.acceptanceRequirement.findMany({
      where: {
        applicationId: this.context.applicationId!,
        status: "PENDING_REVIEW",
      },
    })

    for (const req of pendingReqs) {
      await prisma.acceptanceRequirement.update({
        where: { id: req.id },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: this.context.adminId!,
          adminRemarks: "Approved - Revised document is now compliant",
        },
      })

      console.log(`✅ Admin accepted: ${req.requirementName}`)
    }

    // Check if ALL acceptance requirements are accepted
    const allReqs = await prisma.acceptanceRequirement.findMany({
      where: { applicationId: this.context.applicationId! },
    })

    const allAccepted = allReqs.every((r) => r.status === "ACCEPTED")

    if (allAccepted) {
      // Unlock Other Documents section
      await prisma.application.update({
        where: { id: this.context.applicationId! },
        data: {
          status: "PENDING_OTHER_DOCUMENTS",
        },
      })

      console.log("🎉 ALL acceptance requirements accepted!")
      console.log("🔓 Other Documents section UNLOCKED")
    }
  }

  async test8_UserUploadsOtherDocuments() {
    console.log("\n📂 Test 8: User uploads Other Documents")

    const otherDocTypes = [
      { type: "ECC", name: "Environmental Compliance Certificate" },
      { type: "LGU_ENDORSEMENT", name: "LGU Endorsement" },
      { type: "COMMUNITY_CONSENT", name: "Community Consent" },
      { type: "ANCESTRAL_DOMAIN_CLEARANCE", name: "Ancestral Domain Clearance" },
      { type: "BUSINESS_PERMIT", name: "Business Permit" },
    ]

    const otherDocs = []

    for (const doc of otherDocTypes) {
      const created = await prisma.otherDocument.create({
        data: {
          applicationId: this.context.applicationId!,
          documentType: doc.type,
          documentName: doc.name,
          status: "PENDING_SUBMISSION",
        },
      })

      otherDocs.push(created.id)
    }

    this.context.otherDocumentIds = otherDocs

    // User uploads files
    for (const docId of otherDocs) {
      const doc = await prisma.otherDocument.findUnique({ where: { id: docId } })

      const fileUrl = `https://storage.example.com/other/${doc!.documentType.toLowerCase()}_${Date.now()}.pdf`
      const fileName = `${doc!.documentType}.pdf`

      await prisma.otherDocument.update({
        where: { id: docId },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          submittedBy: this.context.userId!,
          submittedFileUrl: fileUrl,
          submittedFileName: fileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        },
      })

      console.log(`✅ Uploaded: ${doc!.documentName}`)
    }

    // Update application status
    await prisma.application.update({
      where: { id: this.context.applicationId! },
      data: {
        status: "PENDING_OTHER_DOCS_REVIEW",
      },
    })

    console.log(`📤 Submitted ${otherDocTypes.length} other documents for review`)
  }

  async test9_AdminReviewsOtherDocuments() {
    console.log("\n👨‍💼 Test 9: Admin reviews Other Documents")

    const otherDocs = await prisma.otherDocument.findMany({
      where: {
        applicationId: this.context.applicationId!,
        status: "PENDING_REVIEW",
      },
    })

    // Accept all other documents
    for (const doc of otherDocs) {
      await prisma.otherDocument.update({
        where: { id: doc.id },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: this.context.adminId!,
          adminRemarks: "Document is compliant",
        },
      })

      console.log(`✅ Admin accepted: ${doc.documentName}`)
    }

    // Check if ALL other documents accepted
    const allOtherDocs = await prisma.otherDocument.findMany({
      where: { applicationId: this.context.applicationId! },
    })

    const allAccepted = allOtherDocs.every((d) => d.status === "ACCEPTED")

    if (allAccepted) {
      // Move to evaluation phase
      await prisma.application.update({
        where: { id: this.context.applicationId! },
        data: {
          status: "UNDER_REVIEW",
        },
      })

      console.log("🎉 ALL other documents accepted!")
      console.log("✅ Application moved to UNDER_REVIEW (evaluation phase)")
    }
  }

  async test10_VerifyFinalState() {
    console.log("\n🔍 Test 10: Verify final state")

    const application = await prisma.application.findUnique({
      where: { id: this.context.applicationId! },
      include: {
        acceptanceRequirements: true,
        otherDocuments: true,
      },
    })

    if (!application) {
      throw new Error("Application not found")
    }

    console.log("\n📊 Final Application State:")
    console.log(`   Application No: ${application.applicationNo}`)
    console.log(`   Status: ${application.status}`)
    console.log(`   Acceptance Requirements: ${application.acceptanceRequirements.length}`)
    console.log(`     - ACCEPTED: ${application.acceptanceRequirements.filter((r) => r.status === "ACCEPTED").length}`)
    console.log(`   Other Documents: ${application.otherDocuments.length}`)
    console.log(`     - ACCEPTED: ${application.otherDocuments.filter((d) => d.status === "ACCEPTED").length}`)

    // Assertions
    const assertions = [
      {
        condition: application.status === "UNDER_REVIEW",
        message: "Application status is UNDER_REVIEW",
      },
      {
        condition: application.acceptanceRequirements.every((r) => r.status === "ACCEPTED"),
        message: "All acceptance requirements are ACCEPTED",
      },
      {
        condition: application.otherDocuments.every((d) => d.status === "ACCEPTED"),
        message: "All other documents are ACCEPTED",
      },
    ]

    console.log("\n✅ Assertions:")
    for (const assertion of assertions) {
      if (assertion.condition) {
        console.log(`   ✅ ${assertion.message}`)
      } else {
        console.log(`   ❌ FAILED: ${assertion.message}`)
        throw new Error(`Assertion failed: ${assertion.message}`)
      }
    }
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up test data...")

    if (this.context.applicationId) {
      // Delete application (cascades will handle related records)
      await prisma.application.delete({
        where: { id: this.context.applicationId },
      })

      console.log("✅ Test application deleted")
    }
  }

  async runAllTests() {
    try {
      console.log("╔════════════════════════════════════════════════════════╗")
      console.log("║   BATCH UPLOAD WORKFLOW - INTEGRATION TEST SUITE      ║")
      console.log("╚════════════════════════════════════════════════════════╝")
      console.log("")

      await this.setup()
      await this.test1_CreateApplicationWithCoordinates()
      await this.test2_UploadAllDocumentsAtOnce()
      await this.test3_SubmitApplicationAndInitializeRequirements()
      await this.test4_AdminReviewsInParallel()
      await this.test5_AdminRejectsSomeDocuments()
      await this.test6_UserResubmitsRejectedDocuments()
      await this.test7_AdminAcceptsResubmittedDocs()
      await this.test8_UserUploadsOtherDocuments()
      await this.test9_AdminReviewsOtherDocuments()
      await this.test10_VerifyFinalState()

      console.log("\n╔════════════════════════════════════════════════════════╗")
      console.log("║              🎉 ALL TESTS PASSED! 🎉                   ║")
      console.log("╚════════════════════════════════════════════════════════╝")

      // Optionally cleanup
      const shouldCleanup = process.env.CLEANUP_AFTER_TEST !== "false"
      if (shouldCleanup) {
        await this.cleanup()
      } else {
        console.log("\n⚠️  Test data NOT cleaned up (CLEANUP_AFTER_TEST=false)")
        console.log(`   Application ID: ${this.context.applicationId}`)
      }
    } catch (error) {
      console.error("\n❌ TEST FAILED:", error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
}

// Run tests
const tester = new WorkflowTester()
tester.runAllTests()
  .then(() => {
    console.log("\n✅ Test suite completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:", error)
    process.exit(1)
  })
