import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAdmins() {
  const admins = await prisma.adminUser.findMany({
    select: {
      email: true,
      role: true
    }
  })

  console.log('\n👨‍💼 Admin Users:')
  admins.forEach(admin => {
    console.log(`   - ${admin.email} (${admin.role})`)
  })

  const users = await prisma.user.count()
  const applications = await prisma.application.count()

  console.log('\n📊 Database State:')
  console.log(`   Admin Users: ${admins.length}`)
  console.log(`   Regular Users: ${users}`)
  console.log(`   Applications: ${applications}`)

  await prisma.$disconnect()
}

verifyAdmins()
