/**
 * Root Jest config to make editor integrations (Jest-WS) pick up TypeScript transform.
 * Delegates to the backend project which already configures ts-jest.
 */
module.exports = {
  projects: ['<rootDir>/apps/backend'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
};


