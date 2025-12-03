import {
  addWorkingDays,
  getWorkingDaysBetween,
  isWorkingDay,
  generateApplicationNumber,
} from '@/lib/utils'
import { prisma } from '@/lib/db'

describe('Utility Functions - TEST SUITE 4', () => {
  // Clean up database before tests
  beforeEach(async () => {
    await prisma.applicationCounter.deleteMany()
  })

  afterAll(async () => {
    await prisma.applicationCounter.deleteMany()
    await prisma.$disconnect()
  })

  // TEST 1: generateApplicationNumber() - Format
  describe('Test 1: generateApplicationNumber() - Format', () => {
    it('should generate application number in PGIN-YYYY-MM-### format', async () => {
      const applicationNo = await generateApplicationNumber()

      // Test format with regex
      expect(applicationNo).toMatch(/^PGIN-\d{4}-\d{2}-\d{3}$/)

      // Test parts
      const parts = applicationNo.split('-')
      expect(parts).toHaveLength(4)
      expect(parts[0]).toBe('PGIN')

      // Year should be 4 digits
      expect(parts[1]).toHaveLength(4)
      expect(parseInt(parts[1])).toBeGreaterThan(2020)

      // Month should be 2 digits (01-12)
      expect(parts[2]).toHaveLength(2)
      const month = parseInt(parts[2])
      expect(month).toBeGreaterThanOrEqual(1)
      expect(month).toBeLessThanOrEqual(12)

      // Counter should be 3 digits with zero padding
      expect(parts[3]).toHaveLength(3)
      expect(parts[3]).toMatch(/^\d{3}$/)
    })

    it('should generate correct year and month', async () => {
      const now = new Date()
      const expectedYear = now.getFullYear()
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0')

      const applicationNo = await generateApplicationNumber()

      expect(applicationNo).toContain(`PGIN-${expectedYear}-${expectedMonth}`)
    })

    it('should zero-pad counter correctly', async () => {
      const applicationNo = await generateApplicationNumber()

      // First number should be 001
      expect(applicationNo).toMatch(/-001$/)
    })

    it('should zero-pad counter for numbers less than 100', async () => {
      // Create 5 applications to get counter to 5
      for (let i = 0; i < 5; i++) {
        await generateApplicationNumber()
      }

      const applicationNo = await generateApplicationNumber()

      // Should be 006 (zero-padded)
      expect(applicationNo).toMatch(/-006$/)
    })

    it('should not zero-pad counter for numbers >= 100', async () => {
      const now = new Date()

      // Manually create a counter with value 99
      await prisma.applicationCounter.create({
        data: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          counter: 99,
        },
      })

      const applicationNo = await generateApplicationNumber()

      // Should be 100 (no extra zeros)
      expect(applicationNo).toMatch(/-100$/)
    })
  })

  // TEST 2: generateApplicationNumber() - Global Counter
  describe('Test 2: generateApplicationNumber() - Global Counter', () => {
    it('should sum all counters globally across months', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()

      // Create counters for multiple months
      await prisma.applicationCounter.createMany({
        data: [
          { year: currentYear, month: 1, counter: 5 },
          { year: currentYear, month: 2, counter: 8 },
          { year: currentYear, month: 3, counter: 3 },
        ],
      })

      const applicationNo = await generateApplicationNumber()

      // Global counter should be 17 (5+8+3+1 for new one)
      expect(applicationNo).toMatch(/-017$/)
    })

    it('should continue incrementing globally across different months', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()

      // Simulate December with 10 applications
      await prisma.applicationCounter.create({
        data: {
          year: currentYear,
          month: 12,
          counter: 10,
        },
      })

      // Generate new number in current month
      const applicationNo = await generateApplicationNumber()

      // Should be 011 (10 from Dec + 1 from current month)
      expect(applicationNo).toMatch(/-011$/)

      // Verify current month counter is 1
      const currentCounter = await prisma.applicationCounter.findFirst({
        where: {
          year: currentYear,
          month: now.getMonth() + 1,
        },
      })

      expect(currentCounter?.counter).toBe(1)
    })

    it('should handle counters from previous years', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const lastYear = currentYear - 1

      // Create counters from last year
      await prisma.applicationCounter.createMany({
        data: [
          { year: lastYear, month: 11, counter: 20 },
          { year: lastYear, month: 12, counter: 15 },
        ],
      })

      const applicationNo = await generateApplicationNumber()

      // Global counter should be 36 (20+15+1)
      expect(applicationNo).toMatch(/-036$/)
    })

    it('should create counter for new month', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      // Ensure no counter exists for current month
      await prisma.applicationCounter.deleteMany({
        where: { year: currentYear, month: currentMonth },
      })

      await generateApplicationNumber()

      // Verify counter created
      const counter = await prisma.applicationCounter.findFirst({
        where: { year: currentYear, month: currentMonth },
      })

      expect(counter).not.toBeNull()
      expect(counter?.counter).toBe(1)
    })

    it('should increment existing month counter', async () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      // Create initial counter
      await prisma.applicationCounter.create({
        data: {
          year: currentYear,
          month: currentMonth,
          counter: 5,
        },
      })

      await generateApplicationNumber()

      // Verify counter incremented
      const counter = await prisma.applicationCounter.findFirst({
        where: { year: currentYear, month: currentMonth },
      })

      expect(counter?.counter).toBe(6)
    })
  })

  // TEST 3: Working Days Calculations
  describe('Test 3: Working Days Calculations', () => {
    describe('isWorkingDay()', () => {
      it('should identify Monday as working day', () => {
        // Monday, Dec 2, 2024
        const monday = new Date('2024-12-02')
        expect(isWorkingDay(monday)).toBe(true)
      })

      it('should identify Tuesday as working day', () => {
        // Tuesday, Dec 3, 2024
        const tuesday = new Date('2024-12-03')
        expect(isWorkingDay(tuesday)).toBe(true)
      })

      it('should identify Wednesday as working day', () => {
        // Wednesday, Dec 4, 2024
        const wednesday = new Date('2024-12-04')
        expect(isWorkingDay(wednesday)).toBe(true)
      })

      it('should identify Thursday as working day', () => {
        // Thursday, Dec 5, 2024
        const thursday = new Date('2024-12-05')
        expect(isWorkingDay(thursday)).toBe(true)
      })

      it('should identify Friday as working day', () => {
        // Friday, Dec 6, 2024
        const friday = new Date('2024-12-06')
        expect(isWorkingDay(friday)).toBe(true)
      })

      it('should identify Saturday as NOT working day', () => {
        // Saturday, Dec 7, 2024
        const saturday = new Date('2024-12-07')
        expect(isWorkingDay(saturday)).toBe(false)
      })

      it('should identify Sunday as NOT working day', () => {
        // Sunday, Dec 1, 2024
        const sunday = new Date('2024-12-01')
        expect(isWorkingDay(sunday)).toBe(false)
      })
    })

    describe('addWorkingDays()', () => {
      it('should add working days correctly without weekends', () => {
        // Start on Monday, Dec 2, 2024
        const monday = new Date('2024-12-02')

        // Add 3 working days: Mon -> Tue, Wed, Thu
        const result = addWorkingDays(monday, 3)

        // Should be Thursday, Dec 5, 2024
        expect(result.getDate()).toBe(5)
        expect(result.getMonth()).toBe(11) // December is month 11
        expect(result.getFullYear()).toBe(2024)
      })

      it('should skip weekends when adding working days', () => {
        // Start on Friday, Dec 6, 2024
        const friday = new Date('2024-12-06')

        // Add 1 working day: should skip Sat/Sun and land on Monday
        const result = addWorkingDays(friday, 1)

        // Should be Monday, Dec 9, 2024
        expect(result.getDate()).toBe(9)
        expect(result.getDay()).toBe(1) // Monday
      })

      it('should skip weekends when adding multiple working days', () => {
        // Start on Friday, Dec 6, 2024
        const friday = new Date('2024-12-06')

        // Add 5 working days: skip Sat/Sun, count Mon, Tue, Wed, Thu, Fri
        const result = addWorkingDays(friday, 5)

        // Should be Friday, Dec 13, 2024
        expect(result.getDate()).toBe(13)
        expect(result.getDay()).toBe(5) // Friday
      })

      it('should handle adding 14 working days (admin review deadline)', () => {
        // Start on Monday, Dec 2, 2024
        const monday = new Date('2024-12-02')

        // Add 14 working days (2 weeks + 4 weekend days)
        const result = addWorkingDays(monday, 14)

        // Should be Monday, Dec 23, 2024 (skipping 2 weekends)
        expect(result.getDate()).toBe(23)
        expect(result.getDay()).toBe(1) // Monday
      })

      it('should handle starting from Saturday', () => {
        // Start on Saturday, Dec 7, 2024
        const saturday = new Date('2024-12-07')

        // Add 1 working day: skip Sat/Sun, land on Monday
        const result = addWorkingDays(saturday, 1)

        // Should be Tuesday, Dec 10, 2024
        expect(result.getDate()).toBe(10)
        expect(result.getDay()).toBe(2) // Tuesday
      })

      it('should handle starting from Sunday', () => {
        // Start on Sunday, Dec 8, 2024
        const sunday = new Date('2024-12-08')

        // Add 1 working day: skip Sun, count Mon
        const result = addWorkingDays(sunday, 1)

        // Should be Tuesday, Dec 10, 2024
        expect(result.getDate()).toBe(10)
        expect(result.getDay()).toBe(2) // Tuesday
      })
    })

    describe('getWorkingDaysBetween()', () => {
      it('should count working days correctly within same week', () => {
        // Monday to Friday (same week)
        const monday = new Date('2024-12-02')
        const friday = new Date('2024-12-06')

        const count = getWorkingDaysBetween(monday, friday)

        // Mon->Tue, Tue->Wed, Wed->Thu, Thu->Fri = 4 days
        expect(count).toBe(4)
      })

      it('should skip weekends when counting', () => {
        // Friday to next Monday
        const friday = new Date('2024-12-06')
        const nextMonday = new Date('2024-12-09')

        const count = getWorkingDaysBetween(friday, nextMonday)

        // Fri->Sat (skip), Sat->Sun (skip), Sun->Mon (Mon is working day) = 1 day
        expect(count).toBe(1)
      })

      it('should count working days across multiple weeks', () => {
        // Monday Dec 2 to Monday Dec 16 (2 weeks)
        const start = new Date('2024-12-02')
        const end = new Date('2024-12-16')

        const count = getWorkingDaysBetween(start, end)

        // 2 full weeks = 10 working days
        expect(count).toBe(10)
      })

      it('should return 0 for same date', () => {
        const date = new Date('2024-12-02')

        const count = getWorkingDaysBetween(date, date)

        expect(count).toBe(0)
      })

      it('should return 0 for consecutive weekend days', () => {
        const saturday = new Date('2024-12-07')
        const sunday = new Date('2024-12-08')

        const count = getWorkingDaysBetween(saturday, sunday)

        expect(count).toBe(0)
      })

      it('should handle month transitions', () => {
        // Last working day of November to first working day of December
        const nov29 = new Date('2024-11-29') // Friday
        const dec2 = new Date('2024-12-02') // Monday

        const count = getWorkingDaysBetween(nov29, dec2)

        // Fri->Sat (skip), Sat->Sun (skip), Sun->Mon = 1 working day
        expect(count).toBe(1)
      })
    })

    describe('Working Days Integration Tests', () => {
      it('should correctly calculate deadline after adding working days', () => {
        const startDate = new Date('2024-12-02') // Monday
        const deadline = addWorkingDays(startDate, 14) // Add 14 working days

        // Count back to verify
        const daysAdded = getWorkingDaysBetween(startDate, deadline)

        expect(daysAdded).toBe(14)
      })

      it('should verify deadline is a working day', () => {
        const startDate = new Date('2024-12-06') // Friday
        const deadline = addWorkingDays(startDate, 5)

        // Deadline should be a working day
        expect(isWorkingDay(deadline)).toBe(true)
      })

      it('should handle ADMIN_REVIEW_DEADLINE_DAYS constant', () => {
        // Test with the actual constant value (14 working days)
        const ADMIN_REVIEW_DEADLINE_DAYS = 14

        const submissionDate = new Date('2024-12-02')
        const reviewDeadline = addWorkingDays(submissionDate, ADMIN_REVIEW_DEADLINE_DAYS)

        // Verify it's 14 working days later
        const actualDays = getWorkingDaysBetween(submissionDate, reviewDeadline)
        expect(actualDays).toBe(ADMIN_REVIEW_DEADLINE_DAYS)

        // Verify it's a working day
        expect(isWorkingDay(reviewDeadline)).toBe(true)
      })
    })
  })
})
