import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@mgb.gov.ph' },
    update: {},
    create: {
      email: 'admin@mgb.gov.ph',
      password: adminPassword,
      fullName: 'System Administrator',
      position: 'Administrator',
      department: 'MGB Regional Office',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create evaluator user
  const evaluatorPassword = await bcrypt.hash('Evaluator@123', 10)
  
  const evaluator = await prisma.adminUser.upsert({
    where: { email: 'evaluator@mgb.gov.ph' },
    update: {},
    create: {
      email: 'evaluator@mgb.gov.ph',
      password: evaluatorPassword,
      fullName: 'Technical Evaluator',
      position: 'Evaluator',
      department: 'Technical Division',
      role: 'EVALUATOR',
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('✅ Created evaluator user:', evaluator.email)

  // Create test applicant user
  const userPassword = await bcrypt.hash('User@123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: userPassword,
      fullName: 'Test Applicant',
      birthdate: new Date('1990-01-01'),
      mobileNumber: '+63 912 345 6789',
      companyName: 'Test Mining Company',
      address: '123 Test Street, Test City',
      emailVerified: true,
    },
  })

  console.log('✅ Created test user:', user.email)

  console.log('\n📋 Test Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin Login:')
  console.log('  Email: admin@mgb.gov.ph')
  console.log('  Password: Admin@123')
  console.log('')
  console.log('Evaluator Login:')
  console.log('  Email: evaluator@mgb.gov.ph')
  console.log('  Password: Evaluator@123')
  console.log('')
  console.log('Test User Login:')
  console.log('  Email: test@example.com')
  console.log('  Password: User@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

