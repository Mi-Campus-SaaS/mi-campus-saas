module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
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
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['<rootDir>/../tests/e2e/'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};


