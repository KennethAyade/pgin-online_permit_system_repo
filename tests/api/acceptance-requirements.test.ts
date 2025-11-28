/**
 * Acceptance Requirements API Integration Tests
 *
 * Tests the following endpoints:
 * - POST /api/acceptanceRequirements/initialize
 * - POST /api/acceptanceRequirements/submit
 * - POST /api/admin/acceptanceRequirements/review
 *
 * Prerequisites:
 * - Database must have test accounts:
 *   - User: sagkurtkyle@gmail.com
 *   - Admin: admin@mgb.gov.ph
 */

import { PrismaClient } from "@prisma/client"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS, REVISION_DEADLINE_DAYS } from "@/lib/constants"

const prisma = new PrismaClient()

interface TestResult {
  name: string
  status: "PASS" | "FAIL"
  message?: string
  duration: number
}

class AcceptanceRequirementsAPITester {
  private results: TestResult[] = []
  private userId: string = ""
  private adminId: string = ""
  private testApplicationId: string = ""

  async setup() {
    console.log("🔧 Setting up API tests...")

    const user = await prisma.user.findUnique({
      where: { email: "sagkurtkyle@gmail.com" },
    })
    if (!user) throw new Error("Test user not found")
    this.userId = user.id

    const admin = await prisma.adminUser.findUnique({
      where: { email: "admin@mgb.gov.ph" },
    })
    if (!admin) throw new Error("Test admin not found")
    this.adminId = admin.id

    // Create test application
    const app = await prisma.application.create({
      data: {
        userId: this.userId,
        permitType: "ISAG",
        status: "DRAFT",
        projectName: "API Test Application",
        coordinateApprovedAt: new Date(),
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

    this.testApplicationId = app.id
    console.log(`✅ Test application created: ${app.applicationNo}`)
  }

  async test_InitializeWithBatchUpload() {
    const startTime = Date.now()
    const testName = "Initialize API with batch uploaded documents"

    try {
      // Create mock uploaded documents JSON (simulating batch upload)
      const docTypes = ["APPLICATION_FORM", "SURVEY_PLAN", "LOCATION_MAP"]

      const uploadedDocuments = docTypes.reduce((acc, docType) => {
        acc[docType] = {
          fileUrl: `https://example.com/${docType}.pdf`,
          fileName: `${docType}.pdf`,
        }
        return acc
      }, {} as Record<string, { fileUrl: string; fileName: string }>)

      await prisma.application.update({
        where: { id: this.testApplicationId },
        data: { uploadedDocuments },
      })

      // Simulate initialize API logic
      const application = await prisma.application.findUnique({
        where: { id: this.testApplicationId },
      })

      const uploadedDocsJson = (application!.uploadedDocuments as Record<string, {fileUrl: string, fileName: string}>) || {}

      const requirementTypes = [
        "PROJECT_COORDINATES",
        "APPLICATION_FORM",
        "SURVEY_PLAN",
        "LOCATION_MAP",
        "WORK_PROGRAM",
        "IEE_REPORT",
      ]

      const requirementsData = requirementTypes.map((type, index) => {
        const baseData = {
          applicationId: this.testApplicationId,
          requirementType: type,
          requirementName: type.replace(/_/g, " "),
          order: index + 1,
        }

        if (type === "PROJECT_COORDINATES") {
          return {
            ...baseData,
            status: "ACCEPTED" as const,
            submittedAt: new Date(),
            reviewedAt: new Date(),
            adminRemarks: "Pre-approved",
          }
        }

        const uploadedDoc = uploadedDocsJson[type]
        if (uploadedDoc) {
          return {
            ...baseData,
            status: "PENDING_REVIEW" as const,
            submittedAt: new Date(),
            submittedBy: this.userId,
            submittedFileUrl: uploadedDoc.fileUrl,
            submittedFileName: uploadedDoc.fileName,
            autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
          }
        }

        return {
          ...baseData,
          status: "PENDING_SUBMISSION" as const,
        }
      })

      await prisma.acceptanceRequirement.createMany({
        data: requirementsData,
      })

      // Verify results
      const created = await prisma.acceptanceRequirement.findMany({
        where: { applicationId: this.testApplicationId },
      })

      const pendingReview = created.filter((r) => r.status === "PENDING_REVIEW")
      const pendingSubmission = created.filter((r) => r.status === "PENDING_SUBMISSION")
      const accepted = created.filter((r) => r.status === "ACCEPTED")

      // Assertions
      if (created.length !== requirementTypes.length) {
        throw new Error(`Expected ${requirementTypes.length} requirements, got ${created.length}`)
      }

      if (accepted.length !== 1) {
        throw new Error(`Expected 1 ACCEPTED (coordinates), got ${accepted.length}`)
      }

      if (pendingReview.length !== 3) {
        throw new Error(`Expected 3 PENDING_REVIEW (uploaded docs), got ${pendingReview.length}`)
      }

      if (pendingSubmission.length !== 2) {
        throw new Error(`Expected 2 PENDING_SUBMISSION (not uploaded), got ${pendingSubmission.length}`)
      }

      // Verify deadlines are set
      for (const req of pendingReview) {
        if (!req.autoAcceptDeadline) {
          throw new Error(`Requirement ${req.requirementName} missing autoAcceptDeadline`)
        }
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async test_SubmitRequirement() {
    const startTime = Date.now()
    const testName = "Submit requirement API"

    try {
      // Find a PENDING_SUBMISSION requirement
      const requirement = await prisma.acceptanceRequirement.findFirst({
        where: {
          applicationId: this.testApplicationId,
          status: "PENDING_SUBMISSION",
        },
      })

      if (!requirement) {
        throw new Error("No PENDING_SUBMISSION requirement found")
      }

      // Simulate submit API
      const fileUrl = "https://example.com/submitted_doc.pdf"
      const fileName = "submitted_doc.pdf"

      const updated = await prisma.acceptanceRequirement.update({
        where: { id: requirement.id },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          submittedBy: this.userId,
          submittedFileUrl: fileUrl,
          submittedFileName: fileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        },
      })

      // Assertions
      if (updated.status !== "PENDING_REVIEW") {
        throw new Error(`Expected status PENDING_REVIEW, got ${updated.status}`)
      }

      if (!updated.autoAcceptDeadline) {
        throw new Error("autoAcceptDeadline not set")
      }

      if (!updated.submittedFileUrl || !updated.submittedFileName) {
        throw new Error("File information not saved")
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async test_AdminAcceptsRequirement() {
    const startTime = Date.now()
    const testName = "Admin accepts requirement API"

    try {
      const requirement = await prisma.acceptanceRequirement.findFirst({
        where: {
          applicationId: this.testApplicationId,
          status: "PENDING_REVIEW",
        },
      })

      if (!requirement) {
        throw new Error("No PENDING_REVIEW requirement found")
      }

      // Simulate admin accept
      const updated = await prisma.acceptanceRequirement.update({
        where: { id: requirement.id },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: this.adminId,
          adminRemarks: "Document is compliant",
        },
      })

      // Assertions
      if (updated.status !== "ACCEPTED") {
        throw new Error(`Expected status ACCEPTED, got ${updated.status}`)
      }

      if (!updated.reviewedAt || !updated.reviewedBy) {
        throw new Error("Review information not saved")
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async test_AdminRejectsRequirement() {
    const startTime = Date.now()
    const testName = "Admin rejects requirement API"

    try {
      const requirement = await prisma.acceptanceRequirement.findFirst({
        where: {
          applicationId: this.testApplicationId,
          status: "PENDING_REVIEW",
        },
      })

      if (!requirement) {
        throw new Error("No PENDING_REVIEW requirement found")
      }

      // Simulate admin reject
      const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS)

      const updated = await prisma.acceptanceRequirement.update({
        where: { id: requirement.id },
        data: {
          status: "REVISION_REQUIRED",
          reviewedAt: new Date(),
          reviewedBy: this.adminId,
          adminRemarks: "Document needs corrections",
          revisionDeadline,
        },
      })

      // Assertions
      if (updated.status !== "REVISION_REQUIRED") {
        throw new Error(`Expected status REVISION_REQUIRED, got ${updated.status}`)
      }

      if (!updated.revisionDeadline) {
        throw new Error("revisionDeadline not set")
      }

      if (!updated.adminRemarks) {
        throw new Error("adminRemarks not saved")
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async test_ResubmitRejectedRequirement() {
    const startTime = Date.now()
    const testName = "Resubmit rejected requirement API"

    try {
      const requirement = await prisma.acceptanceRequirement.findFirst({
        where: {
          applicationId: this.testApplicationId,
          status: "REVISION_REQUIRED",
        },
      })

      if (!requirement) {
        throw new Error("No REVISION_REQUIRED requirement found")
      }

      // Simulate resubmit
      const newFileUrl = "https://example.com/revised_doc.pdf"
      const newFileName = "revised_doc.pdf"

      const updated = await prisma.acceptanceRequirement.update({
        where: { id: requirement.id },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          submittedBy: this.userId,
          submittedFileUrl: newFileUrl,
          submittedFileName: newFileName,
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        },
      })

      // Assertions
      if (updated.status !== "PENDING_REVIEW") {
        throw new Error(`Expected status PENDING_REVIEW, got ${updated.status}`)
      }

      if (!updated.autoAcceptDeadline) {
        throw new Error("autoAcceptDeadline not reset")
      }

      if (updated.submittedFileUrl !== newFileUrl) {
        throw new Error("New file URL not saved")
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async test_AllAcceptedUnlocksOtherDocuments() {
    const startTime = Date.now()
    const testName = "All requirements accepted unlocks Other Documents"

    try {
      // Accept all remaining requirements
      const pendingReqs = await prisma.acceptanceRequirement.findMany({
        where: {
          applicationId: this.testApplicationId,
          status: { in: ["PENDING_REVIEW", "PENDING_SUBMISSION", "REVISION_REQUIRED"] },
        },
      })

      for (const req of pendingReqs) {
        await prisma.acceptanceRequirement.update({
          where: { id: req.id },
          data: {
            status: "ACCEPTED",
            reviewedAt: new Date(),
            reviewedBy: this.adminId,
            adminRemarks: "Approved",
          },
        })
      }

      // Check if ALL are accepted
      const allReqs = await prisma.acceptanceRequirement.findMany({
        where: { applicationId: this.testApplicationId },
      })

      const allAccepted = allReqs.every((r) => r.status === "ACCEPTED")

      if (!allAccepted) {
        throw new Error("Not all requirements accepted")
      }

      // Simulate unlock Other Documents
      await prisma.application.update({
        where: { id: this.testApplicationId },
        data: {
          status: "PENDING_OTHER_DOCUMENTS",
        },
      })

      const app = await prisma.application.findUnique({
        where: { id: this.testApplicationId },
      })

      if (app!.status !== "PENDING_OTHER_DOCUMENTS") {
        throw new Error(`Expected status PENDING_OTHER_DOCUMENTS, got ${app!.status}`)
      }

      this.results.push({
        name: testName,
        status: "PASS",
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.results.push({
        name: testName,
        status: "FAIL",
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      })
    }
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up test data...")
    if (this.testApplicationId) {
      await prisma.application.delete({
        where: { id: this.testApplicationId },
      })
      console.log("✅ Test application deleted")
    }
  }

  async runAll() {
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║     ACCEPTANCE REQUIREMENTS API INTEGRATION TESTS      ║")
    console.log("╚════════════════════════════════════════════════════════╝\n")

    try {
      await this.setup()

      await this.test_InitializeWithBatchUpload()
      await this.test_SubmitRequirement()
      await this.test_AdminAcceptsRequirement()
      await this.test_AdminRejectsRequirement()
      await this.test_ResubmitRejectedRequirement()
      await this.test_AllAcceptedUnlocksOtherDocuments()

      // Print results
      console.log("\n╔════════════════════════════════════════════════════════╗")
      console.log("║                    TEST RESULTS                        ║")
      console.log("╚════════════════════════════════════════════════════════╝\n")

      const passed = this.results.filter((r) => r.status === "PASS").length
      const failed = this.results.filter((r) => r.status === "FAIL").length

      this.results.forEach((result) => {
        const icon = result.status === "PASS" ? "✅" : "❌"
        const duration = `${result.duration}ms`
        console.log(`${icon} ${result.name} (${duration})`)
        if (result.message) {
          console.log(`   └─ ${result.message}`)
        }
      })

      console.log(`\n📊 Total: ${this.results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`)

      if (failed > 0) {
        throw new Error(`${failed} test(s) failed`)
      }

      await this.cleanup()

      console.log("\n✅ All API tests passed!")
    } catch (error) {
      console.error("\n❌ API tests failed:", error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
}

// Run tests
const tester = new AcceptanceRequirementsAPITester()
tester
  .runAll()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
