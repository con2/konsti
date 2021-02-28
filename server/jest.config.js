module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  modulePathIgnorePatterns: ['<rootDir>/lib'],

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['./src/test/setupTests.ts'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['./src/test/setupTestsAfterEnv.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.ts?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.js?$': ['babel-jest', { rootMode: 'upward' }],
  },

  modulePaths: [`<rootDir>/src`],
};
