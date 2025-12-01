import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function fixStuckOtherDocuments() {
  try {
    console.log("🔧 Starting migration: Fix stuck applications at PENDING_OTHER_DOCUMENTS\n")

    // Find all applications that might be stuck
    const stuckApplications = await prisma.application.findMany({
      where: {
        OR: [
          { status: "PENDING_OTHER_DOCUMENTS" },
          { status: "PENDING_OTHER_DOCS_REVIEW" },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            otherDocuments: true,
          },
        },
      },
    })

    console.log(`📊 Found ${stuckApplications.length} application(s) with PENDING_OTHER_DOCUMENTS status\n`)

    if (stuckApplications.length === 0) {
      console.log("✅ No stuck applications found. All good!\n")
      return
    }

    let fixedCount = 0
    let skippedCount = 0

    // Process each application
    for (const app of stuckApplications) {
      const otherDocsCount = app._count.otherDocuments

      console.log(`\n📋 Application: ${app.applicationNo || app.id}`)
      console.log(`   User: ${app.user?.fullName} (${app.user?.email})`)
      console.log(`   Status: ${app.status}`)
      console.log(`   Existing Other Documents: ${otherDocsCount}`)

      if (otherDocsCount > 0) {
        console.log(`   ⏭️  SKIPPED - Other Documents already exist`)
        skippedCount++
        continue
      }

      // Initialize Other Documents
      console.log(`   🔨 Creating 5 Other Documents...`)

      const otherDocTypes = [
        { type: "ECC", name: "Environmental Compliance Certificate" },
        { type: "LGU_ENDORSEMENT", name: "LGU Endorsement" },
        { type: "COMMUNITY_CONSENT", name: "Community Consent" },
        { type: "ANCESTRAL_DOMAIN_CLEARANCE", name: "Ancestral Domain Clearance" },
        { type: "BUSINESS_PERMIT", name: "Business Permit" },
      ]

      for (const doc of otherDocTypes) {
        await prisma.otherDocument.create({
          data: {
            applicationId: app.id,
            documentType: doc.type,
            documentName: doc.name,
            status: "PENDING_SUBMISSION",
          },
        })
        console.log(`      ✓ ${doc.name}`)
      }

      console.log(`   ✅ FIXED - 5 Other Documents created`)
      fixedCount++
    }

    // Final summary
    console.log("\n" + "═".repeat(60))
    console.log("📊 MIGRATION SUMMARY")
    console.log("═".repeat(60))
    console.log(`Total applications found:     ${stuckApplications.length}`)
    console.log(`Applications fixed:           ${fixedCount}`)
    console.log(`Applications skipped:         ${skippedCount}`)
    console.log("═".repeat(60))

    if (fixedCount > 0) {
      console.log("\n✅ Migration completed successfully!")
      console.log(`   ${fixedCount} application(s) can now proceed with Phase 2 document uploads.\n`)
    } else {
      console.log("\n✅ No applications needed fixing.\n")
    }

  } catch (error) {
    console.error("\n❌ Error during migration:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixStuckOtherDocuments()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
