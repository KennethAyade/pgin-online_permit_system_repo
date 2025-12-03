const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Simpler approach: use testEnvironment based on file location
const customJestConfig = {
  setupFiles: ['<rootDir>/tests/msw-polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client',
  },

  // Use Node.js environment by default (for unit and API tests)
  testEnvironment: 'node',

  // Override to jsdom for component tests
  testEnvironmentOptions: {
    customExportConditions: [''],
  },

  // Help Jest find modules
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Don't transform node_modules except for specific packages if needed
  transformIgnorePatterns: [
    'node_modules/(?!(@prisma/client|@mswjs|msw|until-async)/)',
  ],

  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
}

module.exports = createJestConfig(customJestConfig)
