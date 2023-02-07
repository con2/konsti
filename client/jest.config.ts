import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: "jsdom",

  clearMocks: true,

  moduleNameMapper: {
    "\\.(jpg|png|gif|svg)$": "<rootDir>/src/test/__mocks__/binaryMock.ts",
    "^client(.*)$": "<rootDir>/src/$1",
    "^shared(.*)$": "<rootDir>/../shared/$1",
  },

  setupFiles: ["./src/test/setupTests.ts"],
  setupFilesAfterEnv: ["jest-extended/all"],

  testPathIgnorePatterns: ["playwright"],

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
