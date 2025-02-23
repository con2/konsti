import { defineWorkspace } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineWorkspace([
  "client/vitest.config.mts",
  "server/vitest.config.mts",
  "shared/vitest.config.mts",
]);
