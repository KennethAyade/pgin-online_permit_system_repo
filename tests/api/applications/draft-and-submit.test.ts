import { PUT } from '@/app/api/applications/[id]/draft/route'
import { POST as submitPOST } from '@/app/api/applications/[id]/submit/route'
import { POST as coordinatePOST } from '@/app/api/applications/[id]/submit-coordinates/route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'
import * as authLib from '@/lib/auth'
import * as emailLib from '@/lib/email'

// Mock the auth and email modules
jest.mock('@/lib/auth')
jest.mock('@/lib/email')

const mockedAuth = jest.mocked(authLib.auth)
const mockedSendEmail = jest.mocked(emailLib.sendEmail)

describe('Application Draft & Validation API - TEST SUITE 3', () => {
  let testUserId: string
  let testApplicationId: string

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

  // Helper function to create test application
  async function createTestApplication(userId: string, status: string = 'DRAFT'): Promise<string> {
    const app = await prisma.application.create({
      data: {
        applicationNo: 'PGIN-2025-12-001',
        permitType: 'ISAG',
        userId,
        projectName: 'Test Project',
        status,
        currentStep: 1,
      },
    })
    return app.id
  }

  // Helper function to create required documents for application
  async function createRequiredDocuments(applicationId: string, permitType: 'ISAG' | 'CSAG' = 'ISAG') {
    const requiredDocs = permitType === 'ISAG'
      ? [
          'APPLICATION_FORM',
          'SURVEY_PLAN',
          'LOCATION_MAP',
          'WORK_PROGRAM',
          'IEE_REPORT',
          'EPEP',
          'PROOF_TECHNICAL_COMPETENCE',
          'PROOF_FINANCIAL_CAPABILITY',
          'ARTICLES_INCORPORATION',
        ]
      : [
          'APPLICATION_FORM',
          'SURVEY_PLAN',
          'LOCATION_MAP',
          'WORK_PROGRAM',
          'IEE_REPORT',
          'PROOF_TECHNICAL_COMPETENCE',
          'PROOF_FINANCIAL_CAPABILITY',
          'ARTICLES_INCORPORATION',
        ]

    await prisma.document.createMany({
      data: requiredDocs.map(docType => ({
        applicationId,
        documentType: docType as any,
        documentName: docType,
        fileUrl: `storage/uploads/${applicationId}/${docType}.pdf`,
      })),
    })
  }

  // Helper function to create NextRequest for draft save
  function createDraftRequest(applicationId: string, body: any): NextRequest {
    return new NextRequest(`http://localhost:3000/api/applications/${applicationId}/draft`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // Helper function to create NextRequest for submission
  function createSubmitRequest(applicationId: string, body: any = {}): NextRequest {
    return new NextRequest(`http://localhost:3000/api/applications/${applicationId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // Helper function to create NextRequest for coordinate submission
  function createCoordinateRequest(applicationId: string, body: any): NextRequest {
    return new NextRequest(`http://localhost:3000/api/applications/${applicationId}/submit-coordinates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.document.deleteMany()
    await prisma.applicationStatusHistory.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.application.deleteMany()
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

    // Mock sendEmail to always succeed
    mockedSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })
  })

  afterAll(async () => {
    await prisma.document.deleteMany()
    await prisma.applicationStatusHistory.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.application.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // TEST 1: Draft Save with Partial Data
  describe('Test 1: Draft Save with Partial Data', () => {
    it('should save draft with only project name', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const request = createDraftRequest(testApplicationId, {
        projectName: 'Updated Project Name',
      })

      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('saved successfully')
      expect(data.application.projectName).toBe('Updated Project Name')

      // Verify in database
      const app = await prisma.application.findUnique({
        where: { id: testApplicationId },
      })

      expect(app?.projectName).toBe('Updated Project Name')
      expect(app?.status).toBe('DRAFT') // Status should remain DRAFT
    })

    it('should save draft without validation errors for partial data', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const request = createDraftRequest(testApplicationId, {
        projectName: 'My Project',
        currentStep: 3,
      })

      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.application.currentStep).toBe(3)
    })

    it('should update current step correctly', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const request = createDraftRequest(testApplicationId, {
        currentStep: 5,
      })

      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.application.currentStep).toBe(5)
    })

    it('should only allow draft updates to DRAFT applications', async () => {
      testApplicationId = await createTestApplication(testUserId, 'SUBMITTED')

      const request = createDraftRequest(testApplicationId, {
        projectName: 'Cannot Update',
      })

      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot update submitted application')
    })

    it('should reject draft update from unauthorized user', async () => {
      testApplicationId = await createTestApplication(testUserId)

      // Mock auth to return different user
      mockedAuth.mockResolvedValueOnce({
        user: {
          id: 'different-user-id',
          email: 'other@example.com',
          name: 'Other User',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      })

      const request = createDraftRequest(testApplicationId, {
        projectName: 'Unauthorized Update',
      })

      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  // TEST 2: Submit with Missing Required Fields
  describe('Test 2: Submit with Missing Required Documents', () => {
    it('should reject submission without any documents', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required documents')
      expect(data.missingDocuments).toBeDefined()
      expect(data.missingDocuments.length).toBeGreaterThan(0)
    })

    it('should reject ISAG submission with only partial documents', async () => {
      testApplicationId = await createTestApplication(testUserId)

      // Upload only 3 of 9 required documents for ISAG
      await prisma.document.createMany({
        data: [
          {
            applicationId: testApplicationId,
            documentType: 'APPLICATION_FORM',
            documentName: 'Application Form',
            fileUrl: 'storage/uploads/test/app_form.pdf',
          },
          {
            applicationId: testApplicationId,
            documentType: 'SURVEY_PLAN',
            documentName: 'Survey Plan',
            fileUrl: 'storage/uploads/test/survey.pdf',
          },
          {
            applicationId: testApplicationId,
            documentType: 'LOCATION_MAP',
            documentName: 'Location Map',
            fileUrl: 'storage/uploads/test/map.pdf',
          },
        ],
      })

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required documents')
      expect(data.missingDocuments).toContain('WORK_PROGRAM')
      expect(data.missingDocuments).toContain('IEE_REPORT')
      expect(data.missingDocuments).toContain('EPEP')
    })

    it('should list all missing documents', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.missingDocuments).toEqual(
        expect.arrayContaining([
          'APPLICATION_FORM',
          'SURVEY_PLAN',
          'LOCATION_MAP',
          'WORK_PROGRAM',
          'IEE_REPORT',
          'EPEP',
          'PROOF_TECHNICAL_COMPETENCE',
          'PROOF_FINANCIAL_CAPABILITY',
          'ARTICLES_INCORPORATION',
        ])
      )
    })
  })

  // TEST 3: Submit Without Coordinate Approval
  describe('Test 3: Coordinate Submission Workflow', () => {
    it('should submit coordinates and change status to PENDING_COORDINATE_APPROVAL', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const coordinatesData = {
        projectCoordinates: {
          point1: { latitude: '8.4542', longitude: '124.6319' },
          point2: { latitude: '8.4543', longitude: '124.6320' },
          point3: { latitude: '8.4544', longitude: '124.6321' },
          point4: { latitude: '8.4545', longitude: '124.6322' },
        },
      }

      const request = createCoordinateRequest(testApplicationId, coordinatesData)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await coordinatePOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Coordinates submitted')

      // Verify status changed
      const app = await prisma.application.findUnique({
        where: { id: testApplicationId },
      })

      expect(app?.status).toBe('PENDING_COORDINATE_APPROVAL')
      expect(app?.projectCoordinates).toBeDefined()

      // Verify status history created
      const history = await prisma.applicationStatusHistory.findFirst({
        where: { applicationId: testApplicationId },
      })

      expect(history?.toStatus).toBe('PENDING_COORDINATE_APPROVAL')
    })

    it('should reject coordinate submission with missing points', async () => {
      testApplicationId = await createTestApplication(testUserId)

      const incompleteCoordinates = {
        projectCoordinates: {
          point1: { latitude: '8.4542', longitude: '124.6319' },
          point2: { latitude: '8.4543', longitude: '124.6320' },
          // Missing point3 and point4
        },
      }

      const request = createCoordinateRequest(testApplicationId, incompleteCoordinates)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await coordinatePOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('4 coordinate points are required')
    })
  })

  // TEST 4: Successful Submission
  describe('Test 4: Successful Submission', () => {
    it('should successfully submit application with all required documents', async () => {
      testApplicationId = await createTestApplication(testUserId)

      // Create all required documents
      await createRequiredDocuments(testApplicationId, 'ISAG')

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('submitted successfully')
      expect(data.application.status).toBe('SUBMITTED')

      // Verify status changed in database
      const app = await prisma.application.findUnique({
        where: { id: testApplicationId },
      })

      expect(app?.status).toBe('SUBMITTED')
      expect(app?.submittedAt).toBeDefined()

      // Verify status history created
      const history = await prisma.applicationStatusHistory.findFirst({
        where: {
          applicationId: testApplicationId,
          toStatus: 'SUBMITTED',
        },
      })

      expect(history).not.toBeNull()
      expect(history?.fromStatus).toBe('DRAFT')
    })

    it('should create notification for admin on submission', async () => {
      testApplicationId = await createTestApplication(testUserId)
      await createRequiredDocuments(testApplicationId, 'ISAG')

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })

      expect(response.status).toBe(200)

      // Verify notification created
      const notification = await prisma.notification.findFirst({
        where: {
          applicationId: testApplicationId,
          type: 'APPLICATION_SUBMITTED',
        },
      })

      expect(notification).not.toBeNull()
      expect(notification?.title).toContain('Application Submitted')
    })

    it('should send email notification on submission', async () => {
      testApplicationId = await createTestApplication(testUserId)
      await createRequiredDocuments(testApplicationId, 'ISAG')

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      await submitPOST(request, { params })

      // Verify email sent
      expect(mockedSendEmail).toHaveBeenCalledTimes(1)
      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Application Submitted'),
        })
      )
    })

    it('should allow resubmission from RETURNED status', async () => {
      testApplicationId = await createTestApplication(testUserId, 'RETURNED')
      await createRequiredDocuments(testApplicationId, 'ISAG')

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.application.status).toBe('SUBMITTED')

      // Verify status history shows resubmission
      const history = await prisma.applicationStatusHistory.findFirst({
        where: {
          applicationId: testApplicationId,
          toStatus: 'SUBMITTED',
        },
      })

      expect(history?.remarks).toContain('resubmitted')
    })

    it('should reject submission from non-allowed status', async () => {
      testApplicationId = await createTestApplication(testUserId, 'ACCEPTED')
      await createRequiredDocuments(testApplicationId, 'ISAG')

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be submitted')
    })
  })

  // Additional authorization tests
  describe('Additional Authorization Tests', () => {
    it('should reject draft save without authentication', async () => {
      testApplicationId = await createTestApplication(testUserId)

      mockedAuth.mockResolvedValueOnce(null)

      const request = createDraftRequest(testApplicationId, { projectName: 'Test' })
      const params = Promise.resolve({ id: testApplicationId })
      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject submission without authentication', async () => {
      testApplicationId = await createTestApplication(testUserId)
      await createRequiredDocuments(testApplicationId, 'ISAG')

      mockedAuth.mockResolvedValueOnce(null)

      const request = createSubmitRequest(testApplicationId)
      const params = Promise.resolve({ id: testApplicationId })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject submission for non-existent application', async () => {
      const request = createSubmitRequest('non-existent-id')
      const params = Promise.resolve({ id: 'non-existent-id' })
      const response = await submitPOST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Application not found')
    })
  })
})
