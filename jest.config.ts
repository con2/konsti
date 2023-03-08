import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  projects: ["client", "server"],
  coverageDirectory: "coverage",
  workerIdleMemoryLimit: "1.5GB", // https://github.com/facebook/jest/issues/11956
};

/* eslint-disable-next-line import/no-unused-modules */
export default jestConfig;
