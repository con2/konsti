module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  clearMocks: true,

  coverageDirectory: "coverage",

  modulePathIgnorePatterns: ["./lib"],

  setupFiles: ["./src/test/setupTests.ts"],
  setupFilesAfterEnv: ["./src/test/setupTestsAfterEnv.ts"],

  moduleNameMapper: {
    "^server(.*)$": "<rootDir>/src/$1",
    "^shared(.*)$": "<rootDir>/../shared/$1",
  },

  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
