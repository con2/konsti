module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '\\.(jpg|png|gif|svg)$': '<rootDir>/src/test/__mocks__/binaryMock.ts',
  },

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['./src/test/setupTests.ts'],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: ['enzyme-to-json/serializer'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['cypress'],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.ts?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.js?$': ['babel-jest', { rootMode: 'upward' }],
  },

  modulePaths: [`<rootDir>/src`],
};
