module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  modulePathIgnorePatterns: ['./lib'],
  setupFiles: ['./src/test/setupTests.ts'],
  setupFilesAfterEnv: ['./src/test/setupTestsAfterEnv.ts'],
  testEnvironment: 'node',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^server(.*)$': '<rootDir>/src/$1',
    '^shared(.*)$': '<rootDir>/../shared/$1',
  },
};
