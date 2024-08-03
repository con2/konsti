import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "client/vitest.config.mts",
  "server/vitest.config.mts",
  "shared/vitest.config.mts",
]);
