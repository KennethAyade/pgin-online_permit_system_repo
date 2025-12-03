require('@testing-library/jest-dom')

// Polyfill for Node.js environment (API and unit tests)
// Component tests use jsdom which has these built-in
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Load test environment variables
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ path: '.env.test' })
}

// Set test environment
;(process.env as any).NODE_ENV = 'test'
;(process.env as any).DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

// Only import prisma for tests that actually need database
// Individual test files will import prisma directly when needed
// This prevents module resolution issues in setup

// Global test hooks (empty by default, tests can override)
beforeAll(async () => {
  // Tests requiring database will handle connection in their own beforeAll
})

afterAll(async () => {
  // Tests requiring database will handle disconnection in their own afterAll
})

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks()
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next Auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))
