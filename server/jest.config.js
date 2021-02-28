module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  modulePathIgnorePatterns: ['<rootDir>/lib'],
  setupFiles: ['./src/test/setupTests.ts'],
  setupFilesAfterEnv: ['./src/test/setupTestsAfterEnv.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.js?$': ['babel-jest', { rootMode: 'upward' }],
  },
  modulePaths: [`<rootDir>/src`],
};
