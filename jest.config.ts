import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  projects: ["client", "server"],
  coverageDirectory: "coverage",
};

/* eslint-disable-next-line import/no-unused-modules */
export default jestConfig;
