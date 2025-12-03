import { POST } from '@/app/api/users/register/route'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'
import * as uploadLib from '@/lib/upload'
import * as emailLib from '@/lib/email'

// Mock the upload and email modules
jest.mock('@/lib/upload')
jest.mock('@/lib/email')

const mockedSaveFile = jest.mocked(uploadLib.saveFile)
const mockedSendEmail = jest.mocked(emailLib.sendEmail)

describe('User Registration API - TEST SUITE 1', () => {
  // Helper function to create mock PDF file
  function createMockPDF(name: string, sizeInMB: number = 1): File {
    const size = sizeInMB * 1024 * 1024
    const blob = new Blob([new ArrayBuffer(size)], { type: 'application/pdf' })
    return new File([blob], name, { type: 'application/pdf' })
  }

  // Helper function to create mock invalid file (JPG)
  function createMockJPG(name: string): File {
    const blob = new Blob([new ArrayBuffer(1024)], { type: 'image/jpeg' })
    return new File([blob], name, { type: 'image/jpeg' })
  }

  // Helper function to create FormData for individual account
  function createIndividualFormData(overrides: Record<string, any> = {}): FormData {
    const formData = new FormData()

    formData.append('accountType', overrides.accountType || 'INDIVIDUAL')
    formData.append('email', overrides.email || 'test@example.com')
    formData.append('password', overrides.password || 'Password123!')
    formData.append('fullName', overrides.fullName || 'John Doe')
    formData.append('birthdate', overrides.birthdate || '1990-01-01')
    formData.append('mobileNumber', overrides.mobileNumber || '09123456789')
    formData.append('region', overrides.region || 'Region X')
    formData.append('province', overrides.province || 'Misamis Oriental')
    formData.append('city', overrides.city || 'Cagayan de Oro')
    formData.append('barangay', overrides.barangay || 'Barangay 1')
    formData.append('acceptTerms', overrides.acceptTerms || 'true')

    return formData
  }

  // Helper function to create FormData for corporate account
  function createCorporateFormData(overrides: Record<string, any> = {}, includeFiles: boolean = true): FormData {
    const formData = new FormData()

    formData.append('accountType', 'CORPORATE')
    formData.append('email', overrides.email || 'corporate@example.com')
    formData.append('password', overrides.password || 'Password123!')
    formData.append('fullName', overrides.fullName || 'Corporate Admin')
    formData.append('birthdate', overrides.birthdate || '1985-01-01')
    formData.append('mobileNumber', overrides.mobileNumber || '09123456789')
    formData.append('companyName', overrides.companyName || 'Test Mining Corp')
    formData.append('representativeFullName', overrides.representativeFullName || 'Jane Smith')
    formData.append('representativeEmail', overrides.representativeEmail || 'jane@testcorp.com')
    formData.append('representativeContactNumber', overrides.representativeContactNumber || '09987654321')
    formData.append('representativeBirthday', overrides.representativeBirthday || '1992-05-15')
    formData.append('presidentFullName', overrides.presidentFullName || 'Robert Johnson')
    formData.append('region', overrides.region || 'Region X')
    formData.append('province', overrides.province || 'Misamis Oriental')
    formData.append('city', overrides.city || 'Cagayan de Oro')
    formData.append('barangay', overrides.barangay || 'Barangay 1')
    formData.append('acceptTerms', 'true')

    // Add file uploads if requested
    if (includeFiles) {
      formData.append('presidentAuthLetter', createMockPDF('president_auth.pdf'))
      formData.append('governmentId', createMockPDF('govt_id.pdf'))
      formData.append('companyId', createMockPDF('company_id.pdf'))
      formData.append('secDtiCertificate', createMockPDF('sec_cert.pdf'))
    }

    return formData
  }

  // Helper function to create NextRequest from FormData
  function createRequest(formData: FormData): NextRequest {
    return new NextRequest('http://localhost:3000/api/users/register', {
      method: 'POST',
      body: formData,
    })
  }

  // Clean up database before each test
  beforeEach(async () => {
    await prisma.user.deleteMany()
    jest.clearAllMocks()

    // Mock sendEmail to always succeed
    mockedSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    // Mock saveFile to return success by default
    mockedSaveFile.mockResolvedValue({
      success: true,
      fileName: 'test.pdf',
      fileUrl: 'storage/uploads/registration/test.pdf',
      isBlob: false,
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // TEST 1: Individual Account Registration
  describe('Test 1: Individual Account Registration', () => {
    it('should successfully register an individual account', async () => {
      const formData = createIndividualFormData()
      const request = createRequest(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('registered successfully')
      expect(data.user).toHaveProperty('id')
      expect(data.user.email).toBe('test@example.com')

      // Verify user created in database
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      })

      expect(user).not.toBeNull()
      expect(user?.fullName).toBe('John Doe')
      expect(user?.accountType).toBe('INDIVIDUAL')
      expect(user?.emailVerified).toBe(false)
      expect(user?.emailVerificationToken).toBeTruthy()

      // Verify no corporate fields saved
      expect(user?.companyName).toBeNull()
      expect(user?.representativeFullName).toBeNull()
      expect(user?.presidentFullName).toBeNull()
      expect(user?.governmentIdUrl).toBeNull()

      // Verify email sent
      expect(mockedSendEmail).toHaveBeenCalledTimes(1)
      expect(mockedSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Verify Your Email'),
        })
      )
    })

    it('should hash the password', async () => {
      const formData = createIndividualFormData({ password: 'TestPass123!' })
      const request = createRequest(formData)

      const response = await POST(request)
      expect(response.status).toBe(201)

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      })

      // Password should be hashed (not equal to plain text)
      expect(user?.password).not.toBe('TestPass123!')
      expect(user?.password).toHaveLength(60) // bcrypt hash length
    })
  })

  // TEST 2: Corporate Account Registration - Happy Path
  describe('Test 2: Corporate Account Registration - Happy Path', () => {
    it('should successfully register a corporate account with all documents', async () => {
      const formData = createCorporateFormData()
      const request = createRequest(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('registered successfully')

      // Verify user created with corporate fields
      const user = await prisma.user.findUnique({
        where: { email: 'corporate@example.com' },
      })

      expect(user).not.toBeNull()
      expect(user?.accountType).toBe('CORPORATE')
      expect(user?.companyName).toBe('Test Mining Corp')
      expect(user?.representativeFullName).toBe('Jane Smith')
      expect(user?.representativeEmail).toBe('jane@testcorp.com')
      expect(user?.representativeContactNumber).toBe('09987654321')
      expect(user?.presidentFullName).toBe('Robert Johnson')

      // Verify file URLs saved
      expect(user?.presidentAuthorizationLetterUrl).toBeTruthy()
      expect(user?.governmentIdUrl).toBeTruthy()
      expect(user?.companyIdUrl).toBeTruthy()
      expect(user?.secDtiCertificateUrl).toBeTruthy()

      // Verify saveFile called 4 times
      expect(mockedSaveFile).toHaveBeenCalledTimes(4)

      // Verify saveFile called with correct parameters
      expect(mockedSaveFile).toHaveBeenCalledWith(
        expect.any(File),
        'registration',
        'president_auth'
      )
      expect(mockedSaveFile).toHaveBeenCalledWith(
        expect.any(File),
        'registration',
        'government_id'
      )
      expect(mockedSaveFile).toHaveBeenCalledWith(
        expect.any(File),
        'registration',
        'company_id'
      )
      expect(mockedSaveFile).toHaveBeenCalledWith(
        expect.any(File),
        'registration',
        'sec_dti_cert'
      )
    })
  })

  // TEST 3: Corporate Account - Missing Required Fields
  describe('Test 3: Corporate Account - Missing Required Fields', () => {
    it('should reject corporate registration without representative info', async () => {
      const formData = createCorporateFormData({
        representativeFullName: null,
        representativeEmail: null,
      }, false)

      // Remove representative fields manually
      formData.delete('representativeFullName')
      formData.delete('representativeEmail')

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should reject corporate registration without president name', async () => {
      const formData = createCorporateFormData({}, false)
      formData.delete('presidentFullName')

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  // TEST 4: Corporate Account - Missing Documents
  describe('Test 4: Corporate Account - Missing Documents', () => {
    it('should reject corporate registration with only 2 of 4 files', async () => {
      const formData = createCorporateFormData({}, false)

      // Add only 2 files instead of 4
      formData.append('presidentAuthLetter', createMockPDF('president_auth.pdf'))
      formData.append('governmentId', createMockPDF('govt_id.pdf'))
      // Missing: companyId and secDtiCertificate

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('document uploads are required')
    })

    it('should reject corporate registration with no files', async () => {
      const formData = createCorporateFormData({}, false)

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('document uploads are required')
    })
  })

  // TEST 5: Invalid File Type Validation
  describe('Test 5: Invalid File Type Validation', () => {
    it('should reject JPG file instead of PDF', async () => {
      // Mock saveFile to return validation error for invalid file type
      mockedSaveFile.mockResolvedValueOnce({
        success: false,
        error: 'Only PDF files are allowed',
      })

      const formData = createCorporateFormData({}, false)

      // Add JPG file instead of PDF
      formData.append('presidentAuthLetter', createMockJPG('president_auth.jpg'))
      formData.append('governmentId', createMockPDF('govt_id.pdf'))
      formData.append('companyId', createMockPDF('company_id.pdf'))
      formData.append('secDtiCertificate', createMockPDF('sec_cert.pdf'))

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      // Note: The actual validation happens in saveFile, which we mocked
      // In real scenario, this would be caught by validateFile in upload.ts
      expect(response.status).toBe(500) // Internal error due to file save failure
    })
  })

  // TEST 6: File Size Limit Validation
  describe('Test 6: File Size Limit Validation', () => {
    it('should reject PDF larger than 10MB', async () => {
      // Mock saveFile to return validation error for oversized file
      mockedSaveFile.mockResolvedValueOnce({
        success: false,
        error: 'File size exceeds the maximum limit of 10MB',
      })

      const formData = createCorporateFormData({}, false)

      // Create 11MB PDF (exceeds 10MB limit)
      formData.append('presidentAuthLetter', createMockPDF('large.pdf', 11))
      formData.append('governmentId', createMockPDF('govt_id.pdf'))
      formData.append('companyId', createMockPDF('company_id.pdf'))
      formData.append('secDtiCertificate', createMockPDF('sec_cert.pdf'))

      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500) // Internal error due to file save failure
    })
  })

  // TEST 7: Duplicate Email
  describe('Test 7: Duplicate Email', () => {
    it('should reject registration with existing email', async () => {
      // First registration
      const formData1 = createIndividualFormData({ email: 'duplicate@example.com' })
      const request1 = createRequest(formData1)
      const response1 = await POST(request1)

      expect(response1.status).toBe(201)

      // Second registration with same email
      const formData2 = createIndividualFormData({ email: 'duplicate@example.com' })
      const request2 = createRequest(formData2)
      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(409) // Conflict
      expect(data2.error).toContain('already exists')
    })
  })

  // Additional validation tests
  describe('Additional Validation Tests', () => {
    it('should reject invalid email format', async () => {
      const formData = createIndividualFormData({ email: 'invalid-email' })
      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should reject weak password', async () => {
      const formData = createIndividualFormData({ password: 'weak' })
      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should reject password without special characters', async () => {
      const formData = createIndividualFormData({ password: 'Password123' })
      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should reject missing required address fields', async () => {
      const formData = createIndividualFormData({ region: '' })
      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should reject without accepting terms', async () => {
      const formData = createIndividualFormData({ acceptTerms: 'false' })
      const request = createRequest(formData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })
})
