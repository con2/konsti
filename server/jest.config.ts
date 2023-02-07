import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: "node",

  clearMocks: true,

  modulePathIgnorePatterns: ["./lib"],

  setupFiles: ["./src/test/setupTests.ts"],
  setupFilesAfterEnv: ["./src/test/setupTestsAfterEnv.ts", "jest-extended/all"],

  moduleNameMapper: {
    "^server(.*)$": "<rootDir>/src/$1",
    "^shared(.*)$": "<rootDir>/../shared/$1",
  },

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
};

/* eslint-disable-next-line import/no-unused-modules */
export default jestConfig;
