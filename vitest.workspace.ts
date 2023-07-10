import { defineWorkspace } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineWorkspace([
  "client/vitest.config.ts",
  "server/vitest.config.ts",
  "shared/vitest.config.ts",
]);
