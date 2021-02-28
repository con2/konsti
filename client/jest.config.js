module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '\\.(jpg|png|gif|svg)$': '<rootDir>/src/test/__mocks__/binaryMock.ts',
  },
  setupFiles: ['./src/test/setupTests.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testPathIgnorePatterns: ['cypress'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.ts?$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.js?$': ['babel-jest', { rootMode: 'upward' }],
  },
  modulePaths: [`<rootDir>/src`],
};
