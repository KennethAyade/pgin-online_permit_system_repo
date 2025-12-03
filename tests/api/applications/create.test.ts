import { POST } from '@/app/api/applications/route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'
import * as authLib from '@/lib/auth'

// Mock the auth module
jest.mock('@/lib/auth')
const mockedAuth = jest.mocked(authLib.auth)

describe('Application Creation & Numbering API - TEST SUITE 2', () => {
  let testUserId: string

  // Helper function to create test user
  async function createTestUser(): Promise<string> {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        fullName: 'Test User',
        birthdate: new Date('1990-01-01'),
        accountType: 'INDIVIDUAL',
        region: 'Region X',
        province: 'Misamis Oriental',
        city: 'Cagayan de Oro',
        barangay: 'Barangay 1',
        emailVerified: true,
      },
    })
    return user.id
  }

  // Helper function to create NextRequest with JSON body
  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // Helper to create basic application data
  function createApplicationData(overrides: any = {}) {
    return {
      permitType: 'ISAG',
      projectName: 'Test Project',
      numEmployees: 10,
      currentStep: 1,
      ...overrides,
    }
  }

  // Clean up database before each test
  beforeEach(async () => {
    // Delete all applications and counters
    await prisma.application.deleteMany()
    await prisma.applicationCounter.deleteMany()
    await prisma.user.deleteMany()

    // Create test user
    testUserId = await createTestUser()

    jest.clearAllMocks()

    // Mock auth to return valid session by default
    mockedAuth.mockResolvedValue({
      user: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    })
  })

  afterAll(async () => {
    await prisma.application.deleteMany()
    await prisma.applicationCounter.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // TEST 1: First Application Number Format
  describe('Test 1: First Application Number Format', () => {
    it('should generate first application number in PGIN-YYYY-MM-001 format', async () => {
      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.application).toBeDefined()

      const applicationNo = data.application.applicationNo

      // Verify format: PGIN-YYYY-MM-###
      expect(applicationNo).toMatch(/^PGIN-\d{4}-\d{2}-\d{3}$/)

      // Verify year and month are current
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      expect(applicationNo).toContain(`PGIN-${year}-${month}`)

      // Verify counter is 001
      expect(applicationNo).toMatch(/-001$/)

      // Verify counter in database
      const counter = await prisma.applicationCounter.findFirst({
        where: { year, month: now.getMonth() + 1 },
      })

      expect(counter).not.toBeNull()
      expect(counter?.counter).toBe(1)
    })

    it('should create application with DRAFT status', async () => {
      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.application.status).toBe('DRAFT')
      expect(data.application.currentStep).toBe(1)
    })

    it('should associate application with user', async () => {
      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.application.userId).toBe(testUserId)

      // Verify in database
      const app = await prisma.application.findUnique({
        where: { id: data.application.id },
      })

      expect(app?.userId).toBe(testUserId)
    })
  })

  // TEST 2: Sequential Application Numbers
  describe('Test 2: Sequential Application Numbers', () => {
    it('should generate sequential application numbers', async () => {
      const applications: string[] = []

      // Create 5 applications in sequence
      for (let i = 0; i < 5; i++) {
        const request = createRequest(createApplicationData({
          projectName: `Test Project ${i + 1}`,
        }))
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        applications.push(data.application.applicationNo)
      }

      // Verify all numbers are unique
      const uniqueNumbers = new Set(applications)
      expect(uniqueNumbers.size).toBe(5)

      // Verify sequential counters (001, 002, 003, 004, 005)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `PGIN-${year}-${month}`

      expect(applications[0]).toBe(`${prefix}-001`)
      expect(applications[1]).toBe(`${prefix}-002`)
      expect(applications[2]).toBe(`${prefix}-003`)
      expect(applications[3]).toBe(`${prefix}-004`)
      expect(applications[4]).toBe(`${prefix}-005`)
    })

    it('should increment counter correctly in database', async () => {
      // Create 3 applications
      for (let i = 0; i < 3; i++) {
        const request = createRequest(createApplicationData())
        await POST(request)
      }

      // Verify counter
      const now = new Date()
      const counter = await prisma.applicationCounter.findFirst({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      })

      expect(counter?.counter).toBe(3)
    })
  })

  // TEST 3: Global Counter Across Months
  describe('Test 3: Global Counter Across Months', () => {
    it('should continue global counter across different months', async () => {
      // Create 3 applications in "December"
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      // Manually create December counter (simulate previous month)
      await prisma.applicationCounter.create({
        data: {
          year: currentYear,
          month: 12,
          counter: 3,
        },
      })

      // Create application in current month
      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Global counter should be 4 (3 from December + 1 from current month)
      const applicationNo = data.application.applicationNo
      expect(applicationNo).toMatch(/-004$/)

      // Verify current month counter is 1
      const currentCounter = await prisma.applicationCounter.findFirst({
        where: { year: currentYear, month: currentMonth },
      })
      expect(currentCounter?.counter).toBe(1)

      // Verify global sum is 4
      const totalCount = await prisma.applicationCounter.aggregate({
        _sum: { counter: true },
      })
      expect(totalCount._sum.counter).toBe(4)
    })

    it('should handle multiple months correctly', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      // Simulate counters from multiple previous months
      await prisma.applicationCounter.createMany({
        data: [
          { year: currentYear, month: 1, counter: 5 },
          { year: currentYear, month: 2, counter: 8 },
          { year: currentYear, month: 3, counter: 3 },
        ],
      })

      // Create application in current month
      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Global counter should be 17 (5+8+3+1)
      const applicationNo = data.application.applicationNo
      expect(applicationNo).toMatch(/-017$/)
    })
  })

  // TEST 4: Concurrent Application Creation
  describe('Test 4: Concurrent Application Creation', () => {
    it('should handle concurrent application creation without duplicates', async () => {
      // Create 10 applications concurrently
      const promises = Array.from({ length: 10 }, (_, i) => {
        const request = createRequest(createApplicationData({
          projectName: `Concurrent Project ${i + 1}`,
        }))
        return POST(request)
      })

      const responses = await Promise.all(promises)
      const dataArray = await Promise.all(responses.map(r => r.json()))

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Extract application numbers
      const applicationNos = dataArray.map(d => d.application.applicationNo)

      // Verify all numbers are unique (no duplicates from race condition)
      const uniqueNumbers = new Set(applicationNos)
      expect(uniqueNumbers.size).toBe(10)

      // Verify counter integrity
      const now = new Date()
      const counter = await prisma.applicationCounter.findFirst({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      })

      expect(counter?.counter).toBe(10)

      // Verify all 10 applications exist in database
      const appCount = await prisma.application.count()
      expect(appCount).toBe(10)
    })

    it('should maintain counter consistency under concurrent load', async () => {
      // First batch: 5 concurrent
      const batch1 = Array.from({ length: 5 }, () => {
        const request = createRequest(createApplicationData())
        return POST(request)
      })
      await Promise.all(batch1)

      // Second batch: 5 more concurrent
      const batch2 = Array.from({ length: 5 }, () => {
        const request = createRequest(createApplicationData())
        return POST(request)
      })
      await Promise.all(batch2)

      // Verify final counter is 10
      const now = new Date()
      const counter = await prisma.applicationCounter.findFirst({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      })

      expect(counter?.counter).toBe(10)

      // Verify 10 applications created
      const appCount = await prisma.application.count()
      expect(appCount).toBe(10)
    })
  })

  // TEST 5: Application Creation Authorization
  describe('Test 5: Application Creation Authorization', () => {
    it('should reject request without authentication', async () => {
      // Mock auth to return null (no session)
      mockedAuth.mockResolvedValueOnce(null)

      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      // Verify no application created
      const appCount = await prisma.application.count()
      expect(appCount).toBe(0)

      // Verify no counter created
      const counterCount = await prisma.applicationCounter.count()
      expect(counterCount).toBe(0)
    })

    it('should reject request with invalid session', async () => {
      // Mock auth to return session without user ID
      mockedAuth.mockResolvedValueOnce({
        user: {
          id: '',
          email: '',
          name: '',
        },
        expires: new Date().toISOString(),
      })

      const request = createRequest(createApplicationData())
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  // Additional validation tests
  describe('Additional Validation Tests', () => {
    it('should reject invalid permitType', async () => {
      const request = createRequest({
        permitType: 'INVALID',
        projectName: 'Test',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should accept ISAG permitType', async () => {
      const request = createRequest(createApplicationData({ permitType: 'ISAG' }))
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should accept CSAG permitType', async () => {
      const request = createRequest(createApplicationData({ permitType: 'CSAG' }))
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should allow creation without optional fields', async () => {
      const request = createRequest({
        permitType: 'ISAG',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.application.permitType).toBe('ISAG')
      expect(data.application.applicationNo).toMatch(/^PGIN-/)
    })

    it('should convert string numbers to decimals for numeric fields', async () => {
      const request = createRequest(createApplicationData({
        projectArea: '1500.5',
        footprintArea: '750.25',
        projectCost: '5000000.75',
      }))
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Verify in database (Prisma returns Decimal as number)
      const app = await prisma.application.findUnique({
        where: { id: data.application.id },
      })

      expect(Number(app?.projectArea)).toBe(1500.5)
      expect(Number(app?.footprintArea)).toBe(750.25)
      expect(Number(app?.projectCost)).toBe(5000000.75)
    })
  })
})
