module.exports = {
  // Run tests serially by default to avoid database conflicts in E2E tests
  maxWorkers: 1,
  // Force exit after tests complete (prevents hanging in CI)
  // This is safe because we properly close connections in afterAll hooks
  forceExit: true,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
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
      testPathIgnorePatterns: ['/node_modules/', '\\.e2e-spec\\.ts$'],
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
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


