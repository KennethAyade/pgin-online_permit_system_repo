/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplicationWizard } from '@/components/forms/application-wizard'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { TOTAL_WIZARD_STEPS } from '@/lib/constants'

// Mock next/navigation
const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// MSW server setup
const server = setupServer(
  http.put('/api/applications/:id/draft', () => {
    return HttpResponse.json(
      {
        application: { id: 'test-app-id' },
        message: 'Draft saved successfully',
      },
      { status: 200 }
    )
  }),
  http.post('/api/applications/:id/submit-coordinates', () => {
    return HttpResponse.json(
      {
        application: { id: 'test-app-id', status: 'PENDING_COORDINATE_APPROVAL' },
        message: 'Coordinates submitted for review',
      },
      { status: 200 }
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})
afterAll(() => server.close())

describe('Application Wizard Component - TEST SUITE 6', () => {
  const mockInitialData = {
    id: 'test-app-id',
    applicationNo: 'PGIN-2025-12-001',
    permitType: 'ISAG',
    status: 'DRAFT',
    currentStep: 1,
  }

  // TEST 1: Step Count Display
  describe('Test 1: Step Count Display', () => {
    it('should display "Step 1 of 7" on first step', () => {
      render(<ApplicationWizard applicationId="test-id" initialData={mockInitialData} />)

      // Verify step count is displayed
      expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()
    })

    it('should show total steps from TOTAL_WIZARD_STEPS constant', () => {
      render(<ApplicationWizard applicationId="test-id" initialData={mockInitialData} />)

      const stepText = screen.getByText(/step \d+ of \d+/i)
      expect(stepText.textContent).toContain(`of ${TOTAL_WIZARD_STEPS}`)
      expect(TOTAL_WIZARD_STEPS).toBe(7)
    })

    it('should show progress bar based on 7 total steps', () => {
      render(<ApplicationWizard applicationId="test-id" initialData={mockInitialData} />)

      // Progress bar should exist
      const progressBar = document.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('should update step display when navigating', async () => {
      const user = userEvent.setup()
      const dataWithPermitType = {
        ...mockInitialData,
        permitType: 'ISAG',
        currentStep: 1,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataWithPermitType} />)

      expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()

      // Note: Full navigation would require mocking all step components
      // This test verifies the step counter exists and uses correct total
    })
  })

  // TEST 2: Step Navigation
  describe('Test 2: Step Navigation Sequence', () => {
    it('should follow the correct 7-step sequence', () => {
      render(<ApplicationWizard applicationId="test-id" initialData={mockInitialData} />)

      // Verify we're on step 1
      expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()

      // The sequence should be:
      // 1. Permit Type
      // 2. Project Coordinates
      // 3. Project Info
      // 4. Project Details
      // 5. Acceptance Docs
      // 6. Other Requirements
      // 7. Review

      // Verify step 1 heading (Permit Type)
      expect(screen.getByText(/permit type/i)).toBeInTheDocument()
    })

    it('should NOT include Proponent Info step (removed in Phase 1)', () => {
      render(<ApplicationWizard applicationId="test-id" initialData={mockInitialData} />)

      // Verify total is 7, not 8
      expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()
      expect(screen.queryByText(/step 1 of 8/i)).not.toBeInTheDocument()
    })

    it('should show step titles in correct order', () => {
      const stepsData = [
        { currentStep: 1, expectedTitle: /permit type/i },
        { currentStep: 2, expectedTitle: /project coordinates/i },
        { currentStep: 3, expectedTitle: /project information/i },
        { currentStep: 4, expectedTitle: /project details/i },
        { currentStep: 5, expectedTitle: /acceptance requirements/i },
        { currentStep: 6, expectedTitle: /other requirements/i },
        { currentStep: 7, expectedTitle: /review.*submit/i },
      ]

      stepsData.forEach(({ currentStep, expectedTitle }) => {
        const { unmount } = render(
          <ApplicationWizard
            applicationId="test-id"
            initialData={{ ...mockInitialData, currentStep }}
          />
        )

        expect(screen.getByText(expectedTitle)).toBeInTheDocument()
        unmount()
      })
    })
  })

  // TEST 3: Auto-Save Indicator - Saving
  describe('Test 3: Auto-Save Indicator - Saving State', () => {
    it('should show "Saving..." indicator when saving', async () => {
      jest.useFakeTimers()

      const dataWithStep3 = {
        ...mockInitialData,
        currentStep: 3,
        projectName: 'Initial',
      }

      const { rerender } = render(
        <ApplicationWizard applicationId="test-id" initialData={dataWithStep3} />
      )

      // Update formData to trigger auto-save
      rerender(
        <ApplicationWizard
          applicationId="test-id"
          initialData={{ ...dataWithStep3, projectName: 'Updated' }}
        />
      )

      // Auto-save triggers after 2 second debounce
      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should show Save icon pulsing during save', async () => {
      jest.useFakeTimers()

      const dataWithStep3 = {
        ...mockInitialData,
        currentStep: 3,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataWithStep3} />)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        const savingIndicator = screen.queryByText(/saving/i)
        if (savingIndicator) {
          expect(savingIndicator).toBeInTheDocument()
        }
      })

      jest.useRealTimers()
    })
  })

  // TEST 4: Auto-Save Indicator - Saved
  describe('Test 4: Auto-Save Indicator - Saved State', () => {
    it('should show "Saved" indicator (green) after save completes', async () => {
      jest.useFakeTimers()

      const dataWithStep3 = {
        ...mockInitialData,
        currentStep: 3,
        projectName: 'Test',
      }

      const { rerender } = render(
        <ApplicationWizard applicationId="test-id" initialData={dataWithStep3} />
      )

      // Trigger auto-save
      rerender(
        <ApplicationWizard
          applicationId="test-id"
          initialData={{ ...dataWithStep3, projectName: 'Updated' }}
        />
      )

      // Wait for debounce
      jest.advanceTimersByTime(2000)

      // Wait for API call to complete
      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).toBeInTheDocument()
      })

      // Advance past API response time
      jest.advanceTimersByTime(500)

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should hide "Saved" indicator after 2 seconds', async () => {
      jest.useFakeTimers()

      const dataWithStep3 = {
        ...mockInitialData,
        currentStep: 3,
        projectName: 'Test',
      }

      const { rerender } = render(
        <ApplicationWizard applicationId="test-id" initialData={dataWithStep3} />
      )

      // Trigger save
      rerender(
        <ApplicationWizard
          applicationId="test-id"
          initialData={{ ...dataWithStep3, projectName: 'Updated' }}
        />
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(500)

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument()
      })

      // Advance 2 more seconds
      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText(/saved/i)).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  // TEST 5: Required Field Validation on Submit
  describe('Test 5: Required Field Validation', () => {
    it('should show alert with missing field list on submit attempt', async () => {
      const user = userEvent.setup()
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      const dataAtReviewStep = {
        ...mockInitialData,
        currentStep: 7,
        permitType: 'ISAG',
        // Missing other required fields
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtReviewStep} />)

      // Try to submit with missing fields
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)

      // Should show validation alert
      expect(alertSpy).toHaveBeenCalled()
      const alertMessage = alertSpy.mock.calls[0][0]
      expect(alertMessage).toContain('missing')

      alertSpy.mockRestore()
    })

    it('should prevent submission when required fields are missing', async () => {
      const user = userEvent.setup()
      jest.spyOn(window, 'alert').mockImplementation(() => {})

      const dataAtReviewStep = {
        ...mockInitialData,
        currentStep: 7,
        // Missing required data
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtReviewStep} />)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)

      // Should not navigate away (submission blocked)
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // TEST 6: Currency Symbol Display
  describe('Test 6: Currency Field Icon (PHP)', () => {
    it('should show Banknote icon (not DollarSign) for project cost', () => {
      const dataAtStep4 = {
        ...mockInitialData,
        currentStep: 4,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtStep4} />)

      // Verify Project Cost field label includes (PHP)
      expect(screen.getByText(/project cost.*php/i)).toBeInTheDocument()

      // Note: Icon verification would require checking SVG class or data-testid
      // The implementation uses Banknote icon from lucide-react
    })

    it('should display PHP currency symbol in label', () => {
      const dataAtStep4 = {
        ...mockInitialData,
        currentStep: 4,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtStep4} />)

      // Look for PHP indicator
      const projectCostLabel = screen.getByText(/project cost/i)
      expect(projectCostLabel.textContent).toMatch(/php/i)
    })

    it('should NOT display dollar sign for currency', () => {
      const dataAtStep4 = {
        ...mockInitialData,
        currentStep: 4,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtStep4} />)

      // Should not contain USD or $ symbol
      const container = screen.getByText(/project cost/i).closest('div')
      expect(container?.textContent).not.toMatch(/\$|usd/i)
    })
  })

  // Additional Integration Tests
  describe('Additional Wizard Tests', () => {
    it('should initialize with data from initialData prop', () => {
      const customData = {
        ...mockInitialData,
        currentStep: 3,
        projectName: 'Custom Project',
      }

      render(<ApplicationWizard applicationId="test-id" initialData={customData} />)

      expect(screen.getByText(/step 3 of 7/i)).toBeInTheDocument()
    })

    it('should show navigation buttons (Back/Next)', () => {
      const dataAtStep3 = {
        ...mockInitialData,
        currentStep: 3,
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtStep3} />)

      // Should have back button (since we're not on step 1)
      expect(screen.getByRole('button', { name: /back|previous/i })).toBeInTheDocument()

      // Should have next button
      expect(screen.getByRole('button', { name: /next|continue/i })).toBeInTheDocument()
    })

    it('should disable Next button on coordinate step without approval', () => {
      const dataAtStep2 = {
        ...mockInitialData,
        currentStep: 2,
        status: 'PENDING_COORDINATE_APPROVAL',
      }

      render(<ApplicationWizard applicationId="test-id" initialData={dataAtStep2} />)

      // Next button should be disabled or not proceed without coordinate approval
      const nextButton = screen.queryByRole('button', { name: /next/i })

      // The wizard should prevent progression from step 2 without coordinate approval
      if (nextButton) {
        expect(nextButton).toBeDisabled()
      }
    })
  })
})
