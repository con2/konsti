import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  projects: ["client", "server"],
  coverageDirectory: "coverage",
};

/* eslint-disable-next-line import/no-unused-modules */
export default jestConfig;
