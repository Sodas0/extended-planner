module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    // Handle TypeScript files with JSX
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react',
    }],
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  // Exclude the d.ts file from being treated as a test
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/__tests__/jest.d.ts'],
}; 