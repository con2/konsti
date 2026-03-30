import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "client/vitest.config.mts",
      "server/vitest.config.mts",
      "shared/vitest.config.mts",
    ],
  },
});
