module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  clearMocks: true,

  coverageDirectory: "coverage",

  moduleNameMapper: {
    "\\.(jpg|png|gif|svg)$": "<rootDir>/src/test/__mocks__/binaryMock.ts",
    "^client(.*)$": "<rootDir>/src/$1",
    "^shared(.*)$": "<rootDir>/../shared/$1",
  },

  setupFiles: ["./src/test/setupTests.ts"],

  testPathIgnorePatterns: ["cypress"],
};
