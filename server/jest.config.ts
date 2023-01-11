module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  clearMocks: true,

  modulePathIgnorePatterns: ["./lib"],

  setupFiles: ["./src/test/setupTests.ts"],
  setupFilesAfterEnv: ["./src/test/setupTestsAfterEnv.ts", "jest-extended/all"],

  moduleNameMapper: {
    "^server(.*)$": "<rootDir>/src/$1",
    "^shared(.*)$": "<rootDir>/../shared/$1",
  },
};
