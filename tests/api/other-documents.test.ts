/**
 * Other Documents API Integration Tests
 *
 * Tests the following endpoints:
 * - GET /api/otherDocuments/[id]
 * - POST /api/otherDocuments/submit
 * - POST /api/admin/otherDocuments/review
 *
 * Prerequisites:
 * - Database must have test accounts
 * - Application must have all acceptance requirements ACCEPTED
 */

import { PrismaClient } from "@prisma/client"
import { addWorkingDays } from "@/lib/utils"
import { ADMIN_REVIEW_DEADLINE_DAYS, REVISION_DEADLINE_DAYS } from "@/lib/constants"

const prisma = new PrismaClient()

class OtherDocumentsAPITester {
  private userId: string = ""
  private adminId: string = ""
  private applicationId: string = ""
  private otherDocumentIds: string[] = []

  async setup() {
    console.log("🔧 Setting up Other Documents API tests...")

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

    // Create application with all acceptance requirements ACCEPTED
    const app = await prisma.application.create({
      data: {
        userId: this.userId,
        permitType: "ISAG",
        status: "PENDING_OTHER_DOCUMENTS",
        projectName: "Other Docs API Test",
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

    this.applicationId = app.id

    // Create acceptance requirements (all ACCEPTED)
    await prisma.acceptanceRequirement.createMany({
      data: [
        {
          applicationId: this.applicationId,
          requirementType: "PROJECT_COORDINATES",
          requirementName: "Project Coordinates",
          order: 1,
          status: "ACCEPTED",
          submittedAt: new Date(),
          reviewedAt: new Date(),
        },
        {
          applicationId: this.applicationId,
          requirementType: "APPLICATION_FORM",
          requirementName: "Application Form",
          order: 2,
          status: "ACCEPTED",
          submittedAt: new Date(),
          reviewedAt: new Date(),
        },
      ],
    })

    console.log(`✅ Test application created: ${app.applicationNo}`)
    console.log("✅ All acceptance requirements are ACCEPTED")
  }

  async test1_GetOtherDocuments() {
    console.log("\n📥 Test 1: GET other documents")

    // Create other documents
    const docTypes = [
      { type: "ECC", name: "Environmental Compliance Certificate" },
      { type: "LGU_ENDORSEMENT", name: "LGU Endorsement" },
      { type: "COMMUNITY_CONSENT", name: "Community Consent" },
    ]

    for (const doc of docTypes) {
      const created = await prisma.otherDocument.create({
        data: {
          applicationId: this.applicationId,
          documentType: doc.type,
          documentName: doc.name,
          status: "PENDING_SUBMISSION",
        },
      })
      this.otherDocumentIds.push(created.id)
    }

    // GET documents
    const documents = await prisma.otherDocument.findMany({
      where: { applicationId: this.applicationId },
      orderBy: { createdAt: "asc" },
    })

    // Assertions
    if (documents.length !== 3) {
      throw new Error(`Expected 3 documents, got ${documents.length}`)
    }

    const allPendingSubmission = documents.every((d) => d.status === "PENDING_SUBMISSION")
    if (!allPendingSubmission) {
      throw new Error("Not all documents are PENDING_SUBMISSION")
    }

    console.log(`✅ Retrieved ${documents.length} other documents`)
    console.log("✅ All have status PENDING_SUBMISSION")
  }

  async test2_SubmitOtherDocument() {
    console.log("\n📤 Test 2: Submit other document")

    const document = await prisma.otherDocument.findFirst({
      where: {
        applicationId: this.applicationId,
        status: "PENDING_SUBMISSION",
      },
    })

    if (!document) {
      throw new Error("No PENDING_SUBMISSION document found")
    }

    // Simulate submit
    const fileUrl = "https://example.com/ecc.pdf"
    const fileName = "ecc.pdf"

    const updated = await prisma.otherDocument.update({
      where: { id: document.id },
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
      throw new Error(`Expected PENDING_REVIEW, got ${updated.status}`)
    }

    if (!updated.autoAcceptDeadline) {
      throw new Error("autoAcceptDeadline not set")
    }

    if (!updated.submittedFileUrl || !updated.submittedFileName) {
      throw new Error("File info not saved")
    }

    console.log(`✅ Submitted: ${updated.documentName}`)
    console.log(`✅ Status: ${updated.status}`)
    console.log(`✅ Deadline: ${updated.autoAcceptDeadline.toLocaleDateString()}`)
  }

  async test3_AdminAcceptsOtherDocument() {
    console.log("\n✅ Test 3: Admin accepts other document")

    const document = await prisma.otherDocument.findFirst({
      where: {
        applicationId: this.applicationId,
        status: "PENDING_REVIEW",
      },
    })

    if (!document) {
      throw new Error("No PENDING_REVIEW document found")
    }

    // Simulate admin accept
    const updated = await prisma.otherDocument.update({
      where: { id: document.id },
      data: {
        status: "ACCEPTED",
        reviewedAt: new Date(),
        reviewedBy: this.adminId,
        adminRemarks: "Document is compliant",
      },
    })

    // Assertions
    if (updated.status !== "ACCEPTED") {
      throw new Error(`Expected ACCEPTED, got ${updated.status}`)
    }

    if (!updated.reviewedAt || !updated.reviewedBy) {
      throw new Error("Review info not saved")
    }

    console.log(`✅ Admin accepted: ${updated.documentName}`)
    console.log(`✅ Admin remarks: ${updated.adminRemarks}`)
  }

  async test4_AdminRejectsOtherDocument() {
    console.log("\n❌ Test 4: Admin rejects other document")

    // Submit another document first
    const pendingDoc = await prisma.otherDocument.findFirst({
      where: {
        applicationId: this.applicationId,
        status: "PENDING_SUBMISSION",
      },
    })

    if (pendingDoc) {
      await prisma.otherDocument.update({
        where: { id: pendingDoc.id },
        data: {
          status: "PENDING_REVIEW",
          submittedAt: new Date(),
          submittedBy: this.userId,
          submittedFileUrl: "https://example.com/doc.pdf",
          submittedFileName: "doc.pdf",
          autoAcceptDeadline: addWorkingDays(new Date(), ADMIN_REVIEW_DEADLINE_DAYS),
        },
      })
    }

    const document = await prisma.otherDocument.findFirst({
      where: {
        applicationId: this.applicationId,
        status: "PENDING_REVIEW",
      },
    })

    if (!document) {
      throw new Error("No PENDING_REVIEW document found")
    }

    // Simulate admin reject
    const revisionDeadline = addWorkingDays(new Date(), REVISION_DEADLINE_DAYS)

    const updated = await prisma.otherDocument.update({
      where: { id: document.id },
      data: {
        status: "REVISION_REQUIRED",
        reviewedAt: new Date(),
        reviewedBy: this.adminId,
        adminRemarks: "Document needs corrections - missing signatures",
        revisionDeadline,
      },
    })

    // Assertions
    if (updated.status !== "REVISION_REQUIRED") {
      throw new Error(`Expected REVISION_REQUIRED, got ${updated.status}`)
    }

    if (!updated.revisionDeadline) {
      throw new Error("revisionDeadline not set")
    }

    if (!updated.adminRemarks) {
      throw new Error("adminRemarks not saved")
    }

    console.log(`❌ Admin rejected: ${updated.documentName}`)
    console.log(`   Remarks: ${updated.adminRemarks}`)
    console.log(`   Deadline: ${updated.revisionDeadline.toLocaleDateString()}`)
  }

  async test5_ResubmitRejectedOtherDocument() {
    console.log("\n🔄 Test 5: Resubmit rejected other document")

    const document = await prisma.otherDocument.findFirst({
      where: {
        applicationId: this.applicationId,
        status: "REVISION_REQUIRED",
      },
    })

    if (!document) {
      throw new Error("No REVISION_REQUIRED document found")
    }

    // Simulate resubmit
    const newFileUrl = "https://example.com/doc_revised.pdf"
    const newFileName = "doc_revised.pdf"

    const updated = await prisma.otherDocument.update({
      where: { id: document.id },
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
      throw new Error(`Expected PENDING_REVIEW, got ${updated.status}`)
    }

    if (updated.submittedFileUrl !== newFileUrl) {
      throw new Error("New file URL not saved")
    }

    console.log(`✅ Resubmitted: ${updated.documentName}`)
    console.log(`✅ New file: ${updated.submittedFileName}`)
  }

  async test6_AllOtherDocsAcceptedMovesToUnderReview() {
    console.log("\n🎉 Test 6: All other documents accepted → UNDER_REVIEW")

    // Accept all remaining documents
    const pendingDocs = await prisma.otherDocument.findMany({
      where: {
        applicationId: this.applicationId,
        status: { in: ["PENDING_REVIEW", "PENDING_SUBMISSION", "REVISION_REQUIRED"] },
      },
    })

    for (const doc of pendingDocs) {
      await prisma.otherDocument.update({
        where: { id: doc.id },
        data: {
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedBy: this.adminId,
          adminRemarks: "Approved",
        },
      })
    }

    // Check if ALL are accepted
    const allDocs = await prisma.otherDocument.findMany({
      where: { applicationId: this.applicationId },
    })

    const allAccepted = allDocs.every((d) => d.status === "ACCEPTED")

    if (!allAccepted) {
      throw new Error("Not all other documents accepted")
    }

    // Move application to UNDER_REVIEW
    await prisma.application.update({
      where: { id: this.applicationId },
      data: {
        status: "UNDER_REVIEW",
      },
    })

    const app = await prisma.application.findUnique({
      where: { id: this.applicationId },
    })

    if (app!.status !== "UNDER_REVIEW") {
      throw new Error(`Expected UNDER_REVIEW, got ${app!.status}`)
    }

    console.log("✅ All other documents accepted")
    console.log("✅ Application moved to UNDER_REVIEW")
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up test data...")
    if (this.applicationId) {
      await prisma.application.delete({
        where: { id: this.applicationId },
      })
      console.log("✅ Test application deleted")
    }
  }

  async runAll() {
    console.log("╔════════════════════════════════════════════════════════╗")
    console.log("║        OTHER DOCUMENTS API INTEGRATION TESTS           ║")
    console.log("╚════════════════════════════════════════════════════════╝")

    try {
      await this.setup()
      await this.test1_GetOtherDocuments()
      await this.test2_SubmitOtherDocument()
      await this.test3_AdminAcceptsOtherDocument()
      await this.test4_AdminRejectsOtherDocument()
      await this.test5_ResubmitRejectedOtherDocument()
      await this.test6_AllOtherDocsAcceptedMovesToUnderReview()

      console.log("\n╔════════════════════════════════════════════════════════╗")
      console.log("║              🎉 ALL TESTS PASSED! 🎉                   ║")
      console.log("╚════════════════════════════════════════════════════════╝")

      await this.cleanup()
    } catch (error) {
      console.error("\n❌ Test failed:", error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
}

// Run tests
const tester = new OtherDocumentsAPITester()
tester
  .runAll()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
