/**
 * Root Jest config to make editor integrations (Jest-WS) pick up TypeScript transform.
 * Expands backend projects directly to avoid nested project warnings.
 */
module.exports = {
  maxWorkers: 1,
  forceExit: process.env.CI === 'true',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/tests/e2e/',
  ],
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/apps/backend',
      roots: ['<rootDir>/src'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
            diagnostics: false,
          },
        ],
      },
      testMatch: ['**/*.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', String.raw`\.e2e-spec\.ts$`],
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/apps/backend',
      roots: ['<rootDir>/test'],
      moduleFileExtensions: ['ts', 'js', 'json'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.spec.json',
            diagnostics: false,
          },
        ],
      },
      testMatch: ['**/*.e2e-spec.ts'],
      testPathIgnorePatterns: ['/node_modules/'],
      testRunner: 'jest-circus/runner',
    },
  ],
};


