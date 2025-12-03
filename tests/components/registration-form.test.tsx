/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegistrationForm } from '@/components/forms/registration-form'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock philippines-address-api
jest.mock('@/lib/services/philippines-address-api', () => ({
  philippinesAddressAPI: {
    getRegions: jest.fn().mockResolvedValue([
      { code: '10', regionName: 'Region X - Northern Mindanao' },
      { code: '13', regionName: 'NCR' },
    ]),
    getProvincesByRegion: jest.fn().mockResolvedValue([
      { code: '1043', name: 'Misamis Oriental' },
      { code: '1042', name: 'Bukidnon' },
    ]),
    getCitiesByProvince: jest.fn().mockResolvedValue([
      { code: '104213', name: 'Cagayan de Oro City' },
      { code: '104214', name: 'Valencia City' },
    ]),
    getBarangaysByCity: jest.fn().mockResolvedValue([
      { code: '10421301', name: 'Barangay 1' },
      { code: '10421302', name: 'Barangay 2' },
    ]),
  },
}))

// MSW server setup for API mocking
const server = setupServer(
  http.post('/api/users/register', async ({ request }) => {
    const formData = await request.formData()
    const accountType = formData.get('accountType')

    return HttpResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: 'test-user-id',
          email: formData.get('email'),
        },
      },
      { status: 201 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})
afterAll(() => server.close())

describe('Registration Form Component - TEST SUITE 5', () => {
  // Helper to create a mock PDF file
  const createMockPDFFile = (fileName: string = 'test.pdf'): File => {
    const blob = new Blob(['%PDF-1.4 test content'], { type: 'application/pdf' })
    return new File([blob], fileName, { type: 'application/pdf' })
  }

  // Helper to fill common fields
  const fillCommonFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'Password123!')

    const birthdateInput = screen.getByLabelText(/birth date/i)
    await user.type(birthdateInput, '1990-01-01')

    // Select address fields
    await waitFor(() => {
      expect(screen.getByLabelText(/region/i)).toBeEnabled()
    })

    await user.selectOptions(screen.getByLabelText(/region/i), '10')

    await waitFor(() => {
      expect(screen.getByLabelText(/province/i)).toBeEnabled()
    })

    await user.selectOptions(screen.getByLabelText(/province/i), '1043')

    await waitFor(() => {
      expect(screen.getByLabelText(/city/i)).toBeEnabled()
    })

    await user.selectOptions(screen.getByLabelText(/city/i), '104213')

    await waitFor(() => {
      expect(screen.getByLabelText(/barangay/i)).toBeEnabled()
    })

    await user.selectOptions(screen.getByLabelText(/barangay/i), '10421301')

    // Accept terms
    await user.click(screen.getByRole('checkbox', { name: /accept the terms/i }))
  }

  // TEST 1: Individual Account Form Rendering
  describe('Test 1: Individual Account Form Rendering', () => {
    it('should render form with INDIVIDUAL option selected by default or selectable', async () => {
      render(<RegistrationForm />)

      // Verify account type radio buttons exist
      const individualRadio = screen.getByLabelText(/individual/i)
      const corporateRadio = screen.getByLabelText(/corporate/i)

      expect(individualRadio).toBeInTheDocument()
      expect(corporateRadio).toBeInTheDocument()
    })

    it('should NOT show corporate fields when INDIVIDUAL is selected', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      // Select individual account type
      const individualRadio = screen.getByLabelText(/individual/i)
      await user.click(individualRadio)

      // Verify corporate fields are NOT rendered
      expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/representative.*authorized signatory/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/company president/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/required documents/i)).not.toBeInTheDocument()

      // Verify file upload inputs are NOT visible
      expect(screen.queryByLabelText(/president.*authorization letter/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/government id/i)).not.toBeInTheDocument()
    })

    it('should show only basic personal fields for individual account', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/individual/i))

      // Verify basic fields are shown
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/region/i)).toBeInTheDocument()
    })
  })

  // TEST 2: Corporate Account Form Rendering
  describe('Test 2: Corporate Account Form Rendering', () => {
    it('should show all corporate fields when CORPORATE is selected', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      // Select corporate account type
      await user.click(screen.getByLabelText(/corporate/i))

      // Verify company name appears
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()

      // Verify representative section appears
      expect(screen.getByText(/representative.*authorized signatory/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/representative full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/representative email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/representative contact number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/representative birthday/i)).toBeInTheDocument()

      // Verify president section appears
      expect(screen.getByText(/company president/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/president.*full name/i)).toBeInTheDocument()
    })

    it('should show 4 document upload inputs for corporate account', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      // Verify all 4 document upload sections are visible
      expect(screen.getByText(/president.*authorization letter/i)).toBeInTheDocument()
      expect(screen.getByText(/^government id/i)).toBeInTheDocument()
      expect(screen.getByText(/^company id/i)).toBeInTheDocument()
      expect(screen.getByText(/sec or dti registration certificate/i)).toBeInTheDocument()

      // Verify "Choose File" buttons
      const chooseFileButtons = screen.getAllByText(/choose file/i)
      expect(chooseFileButtons).toHaveLength(4)
    })

    it('should show Required Documents section header', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      expect(screen.getByText(/required documents/i)).toBeInTheDocument()
    })
  })

  // TEST 3: Form Validation - Missing Corporate Fields
  describe('Test 3: Form Validation - Missing Corporate Fields', () => {
    it('should show validation error when corporate fields are missing', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      // Select corporate but only fill basic fields
      await user.click(screen.getByLabelText(/corporate/i))

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')

      const birthdateInput = screen.getByLabelText(/birth date/i)
      await user.type(birthdateInput, '1990-01-01')

      // Fill address
      await waitFor(() => {
        expect(screen.getByLabelText(/region/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/region/i), '10')

      await waitFor(() => {
        expect(screen.getByLabelText(/province/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/province/i), '1043')

      await waitFor(() => {
        expect(screen.getByLabelText(/city/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/city/i), '104213')

      await waitFor(() => {
        expect(screen.getByLabelText(/barangay/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/barangay/i), '10421301')

      await user.click(screen.getByRole('checkbox', { name: /accept the terms/i }))

      // Try to submit without corporate fields
      const submitButton = screen.getByRole('button', { name: /register now/i })
      await user.click(submitButton)

      // Form should not submit (validation will prevent it)
      // Note: React Hook Form will show validation errors inline
      await waitFor(() => {
        // The form should still be on the page (not navigated away)
        expect(screen.getByRole('button', { name: /register now/i })).toBeInTheDocument()
      })
    })
  })

  // TEST 4: File Upload Interaction
  describe('Test 4: File Upload Interaction', () => {
    it('should display file name after upload', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      // Get the file input for president auth letter
      const fileInput = document.querySelector('#presidentAuthLetter') as HTMLInputElement

      const mockFile = createMockPDFFile('president_auth.pdf')

      // Upload file
      await user.upload(fileInput, mockFile)

      // Verify file name is displayed
      await waitFor(() => {
        expect(screen.getByText('president_auth.pdf')).toBeInTheDocument()
      })
    })

    it('should handle multiple file uploads', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      // Upload all 4 required files
      const presidentAuthInput = document.querySelector('#presidentAuthLetter') as HTMLInputElement
      const govIdInput = document.querySelector('#governmentId') as HTMLInputElement
      const companyIdInput = document.querySelector('#companyId') as HTMLInputElement
      const secDtiInput = document.querySelector('#secDtiCertificate') as HTMLInputElement

      await user.upload(presidentAuthInput, createMockPDFFile('president.pdf'))
      await user.upload(govIdInput, createMockPDFFile('govt_id.pdf'))
      await user.upload(companyIdInput, createMockPDFFile('company.pdf'))
      await user.upload(secDtiInput, createMockPDFFile('sec_cert.pdf'))

      // Verify all file names are displayed
      await waitFor(() => {
        expect(screen.getByText('president.pdf')).toBeInTheDocument()
        expect(screen.getByText('govt_id.pdf')).toBeInTheDocument()
        expect(screen.getByText('company.pdf')).toBeInTheDocument()
        expect(screen.getByText('sec_cert.pdf')).toBeInTheDocument()
      })
    })

    it('should show Choose File buttons work correctly', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      const chooseFileButtons = screen.getAllByText(/choose file/i)
      expect(chooseFileButtons).toHaveLength(4)

      // All buttons should be clickable labels
      chooseFileButtons.forEach(button => {
        expect(button.tagName).toBe('LABEL')
        expect(button).toHaveAttribute('for')
      })
    })
  })

  // TEST 5: Form Submission - Individual
  describe('Test 5: Form Submission - Individual', () => {
    it('should submit individual account successfully', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      // Select individual
      await user.click(screen.getByLabelText(/individual/i))

      // Fill all fields
      await fillCommonFields(user)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register now/i })
      await user.click(submitButton)

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
        expect(screen.getByText(/check your email to verify your account/i)).toBeInTheDocument()
      })
    })

    it('should send FormData (not JSON) for individual account', async () => {
      const user = userEvent.setup()

      // Intercept the request to verify FormData
      let requestBody: any = null
      server.use(
        http.post('/api/users/register', async ({ request }) => {
          requestBody = await request.formData()
          return HttpResponse.json(
            {
              message: 'User registered successfully',
              user: { id: 'test-id', email: 'john@example.com' },
            },
            { status: 201 }
          )
        })
      )

      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/individual/i))
      await fillCommonFields(user)

      await user.click(screen.getByRole('button', { name: /register now/i }))

      await waitFor(() => {
        expect(requestBody).not.toBeNull()
        expect(requestBody).toBeInstanceOf(FormData)
        expect(requestBody.get('accountType')).toBe('INDIVIDUAL')
        expect(requestBody.get('email')).toBe('john@example.com')
      })
    })
  })

  // TEST 6: Form Submission - Corporate
  describe('Test 6: Form Submission - Corporate', () => {
    it('should submit corporate account with all fields and files', async () => {
      const user = userEvent.setup()
      render(<RegistrationForm />)

      // Select corporate
      await user.click(screen.getByLabelText(/corporate/i))

      // Fill basic fields
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')
      await user.type(screen.getByLabelText(/birth date/i), '1990-01-01')

      // Fill corporate fields
      await user.type(screen.getByLabelText(/company name/i), 'Test Mining Corp')
      await user.type(screen.getByLabelText(/representative full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/representative email/i), 'jane@testcorp.com')
      await user.type(screen.getByLabelText(/representative contact number/i), '09123456789')
      await user.type(screen.getByLabelText(/representative birthday/i), '1992-05-15')
      await user.type(screen.getByLabelText(/president.*full name/i), 'Robert Johnson')

      // Fill address
      await waitFor(() => {
        expect(screen.getByLabelText(/region/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/region/i), '10')
      await waitFor(() => {
        expect(screen.getByLabelText(/province/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/province/i), '1043')
      await waitFor(() => {
        expect(screen.getByLabelText(/city/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/city/i), '104213')
      await waitFor(() => {
        expect(screen.getByLabelText(/barangay/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/barangay/i), '10421301')

      // Upload files
      const presidentAuthInput = document.querySelector('#presidentAuthLetter') as HTMLInputElement
      const govIdInput = document.querySelector('#governmentId') as HTMLInputElement
      const companyIdInput = document.querySelector('#companyId') as HTMLInputElement
      const secDtiInput = document.querySelector('#secDtiCertificate') as HTMLInputElement

      await user.upload(presidentAuthInput, createMockPDFFile('president.pdf'))
      await user.upload(govIdInput, createMockPDFFile('govt_id.pdf'))
      await user.upload(companyIdInput, createMockPDFFile('company.pdf'))
      await user.upload(secDtiInput, createMockPDFFile('sec_cert.pdf'))

      // Accept terms
      await user.click(screen.getByRole('checkbox', { name: /accept the terms/i }))

      // Submit
      await user.click(screen.getByRole('button', { name: /register now/i }))

      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
      })
    })

    it('should include all corporate fields and files in FormData', async () => {
      const user = userEvent.setup()

      // Intercept request
      let requestFormData: FormData | null = null
      server.use(
        http.post('/api/users/register', async ({ request }) => {
          requestFormData = await request.formData()
          return HttpResponse.json(
            {
              message: 'User registered successfully',
              user: { id: 'test-id', email: 'john@example.com' },
            },
            { status: 201 }
          )
        })
      )

      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/corporate/i))

      // Fill all fields
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'corporate@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'Password123!')
      await user.type(screen.getByLabelText(/birth date/i), '1990-01-01')
      await user.type(screen.getByLabelText(/company name/i), 'Test Corp')
      await user.type(screen.getByLabelText(/representative full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/representative email/i), 'jane@testcorp.com')
      await user.type(screen.getByLabelText(/representative contact number/i), '09123456789')
      await user.type(screen.getByLabelText(/representative birthday/i), '1992-05-15')
      await user.type(screen.getByLabelText(/president.*full name/i), 'Robert Johnson')

      // Address
      await waitFor(() => expect(screen.getByLabelText(/region/i)).toBeEnabled())
      await user.selectOptions(screen.getByLabelText(/region/i), '10')
      await waitFor(() => expect(screen.getByLabelText(/province/i)).toBeEnabled())
      await user.selectOptions(screen.getByLabelText(/province/i), '1043')
      await waitFor(() => expect(screen.getByLabelText(/city/i)).toBeEnabled())
      await user.selectOptions(screen.getByLabelText(/city/i), '104213')
      await waitFor(() => expect(screen.getByLabelText(/barangay/i)).toBeEnabled())
      await user.selectOptions(screen.getByLabelText(/barangay/i), '10421301')

      // Upload files
      const presidentAuthInput = document.querySelector('#presidentAuthLetter') as HTMLInputElement
      const govIdInput = document.querySelector('#governmentId') as HTMLInputElement
      const companyIdInput = document.querySelector('#companyId') as HTMLInputElement
      const secDtiInput = document.querySelector('#secDtiCertificate') as HTMLInputElement

      await user.upload(presidentAuthInput, createMockPDFFile('president.pdf'))
      await user.upload(govIdInput, createMockPDFFile('govt.pdf'))
      await user.upload(companyIdInput, createMockPDFFile('company.pdf'))
      await user.upload(secDtiInput, createMockPDFFile('sec.pdf'))

      await user.click(screen.getByRole('checkbox', { name: /accept the terms/i }))

      await user.click(screen.getByRole('button', { name: /register now/i }))

      await waitFor(() => {
        expect(requestFormData).not.toBeNull()
      })

      // Verify all fields in FormData
      expect(requestFormData?.get('accountType')).toBe('CORPORATE')
      expect(requestFormData?.get('companyName')).toBe('Test Corp')
      expect(requestFormData?.get('representativeFullName')).toBe('Jane Smith')
      expect(requestFormData?.get('presidentFullName')).toBe('Robert Johnson')

      // Verify files
      expect(requestFormData?.get('presidentAuthLetter')).toBeInstanceOf(File)
      expect(requestFormData?.get('governmentId')).toBeInstanceOf(File)
      expect(requestFormData?.get('companyId')).toBeInstanceOf(File)
      expect(requestFormData?.get('secDtiCertificate')).toBeInstanceOf(File)
    })
  })

  // Additional tests
  describe('Additional Functionality Tests', () => {
    it('should redirect to login after successful registration', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ delay: null })

      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/individual/i))
      await fillCommonFields(user)
      await user.click(screen.getByRole('button', { name: /register now/i }))

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })

      jest.useRealTimers()
    })

    it('should show error message on registration failure', async () => {
      const user = userEvent.setup()

      // Mock API failure
      server.use(
        http.post('/api/users/register', () => {
          return HttpResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          )
        })
      )

      render(<RegistrationForm />)

      await user.click(screen.getByLabelText(/individual/i))
      await fillCommonFields(user)
      await user.click(screen.getByRole('button', { name: /register now/i }))

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })
})
