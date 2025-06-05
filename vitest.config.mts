import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  test: {
    projects: [
      "client/vitest.config.mts",
      "server/vitest.config.mts",
      "shared/vitest.config.mts",
    ],
  },
});
