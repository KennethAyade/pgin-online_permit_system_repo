import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...')

    // Admin emails to preserve
    const adminEmails = [
      'admin@mgb.gov.ph',
      'evaluator@mgb.gov.ph'
    ]

    console.log(`\n📋 Preserving admin accounts: ${adminEmails.join(', ')}`)

    // 1. Delete all applications (cascades will handle related records)
    console.log('\n🗂️  Deleting all applications...')
    const deletedApps = await prisma.application.deleteMany({})
    console.log(`   ✅ Deleted ${deletedApps.count} applications`)

    // 2. Delete all notifications
    console.log('\n🔔 Deleting all notifications...')
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`)

    // 3. Delete all comments
    console.log('\n💬 Deleting all comments...')
    const deletedComments = await prisma.comment.deleteMany({})
    console.log(`   ✅ Deleted ${deletedComments.count} comments`)

    // 4. Delete all documents
    console.log('\n📄 Deleting all documents...')
    const deletedDocs = await prisma.document.deleteMany({})
    console.log(`   ✅ Deleted ${deletedDocs.count} documents`)

    // 5. Delete all acceptance requirements
    console.log('\n📝 Deleting all acceptance requirements...')
    const deletedReqs = await prisma.acceptanceRequirement.deleteMany({})
    console.log(`   ✅ Deleted ${deletedReqs.count} acceptance requirements`)

    // 6. Delete all other documents
    console.log('\n📋 Deleting all other documents...')
    const deletedOtherDocs = await prisma.otherDocument.deleteMany({})
    console.log(`   ✅ Deleted ${deletedOtherDocs.count} other documents`)

    // 7. Delete all evaluations
    console.log('\n📊 Deleting all evaluations...')
    const deletedEvals = await prisma.evaluation.deleteMany({})
    console.log(`   ✅ Deleted ${deletedEvals.count} evaluations`)

    // 8. Delete all users EXCEPT admin accounts
    console.log('\n👥 Deleting all non-admin users...')
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          notIn: adminEmails
        }
      }
    })
    console.log(`   ✅ Deleted ${deletedUsers.count} users`)

    // Verify remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        email: true,
        fullName: true
      }
    })

    console.log('\n✅ Database cleanup complete!')
    console.log('\n📊 Remaining users:')
    remainingUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.fullName})`)
    })

    // Count remaining records
    const stats = {
      users: await prisma.user.count(),
      applications: await prisma.application.count(),
      documents: await prisma.document.count(),
      notifications: await prisma.notification.count(),
      comments: await prisma.comment.count()
    }

    console.log('\n📈 Database statistics:')
    console.log(`   Users: ${stats.users}`)
    console.log(`   Applications: ${stats.applications}`)
    console.log(`   Documents: ${stats.documents}`)
    console.log(`   Notifications: ${stats.notifications}`)
    console.log(`   Comments: ${stats.comments}`)

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDatabase()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
