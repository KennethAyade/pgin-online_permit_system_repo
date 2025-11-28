import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log("🗑️  Starting database reset...")

    // Delete all applications and related data (cascades will handle related records)
    console.log("Deleting applications and related data...")
    await prisma.application.deleteMany({})

    // Delete all notifications
    console.log("Deleting notifications...")
    await prisma.notification.deleteMany({})

    // Delete all users EXCEPT the specified one
    console.log("Deleting users except sagkurtkyle@gmail.com...")
    await prisma.user.deleteMany({
      where: {
        email: {
          not: "sagkurtkyle@gmail.com"
        }
      }
    })

    // Delete all admin users EXCEPT the specified one
    console.log("Deleting admin users except admin@mgb.gov.ph...")
    await prisma.adminUser.deleteMany({
      where: {
        email: {
          not: "admin@mgb.gov.ph"
        }
      }
    })

    // Verify remaining accounts
    const remainingUsers = await prisma.user.findMany({
      select: { email: true, fullName: true }
    })

    const remainingAdmins = await prisma.adminUser.findMany({
      select: { email: true, fullName: true }
    })

    console.log("\n✅ Database reset complete!")
    console.log("\n📋 Remaining accounts:")
    console.log("\n👤 Users:")
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.fullName})`)
    })

    console.log("\n👨‍💼 Admin Users:")
    remainingAdmins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.fullName})`)
    })

    console.log("\n✨ All applications, documents, and dummy data have been removed.")
    console.log("The database is now clean and ready for testing!\n")

  } catch (error) {
    console.error("❌ Error resetting database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
