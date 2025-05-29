import path from "node:path";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./server/src/test/globalSetup.ts"],
    setupFiles: ["./src/test/setupTests.ts"],
    testTimeout: 30 * 1000,
    hookTimeout: 60 * 1000,
    coverage: {
      provider: "istanbul",
      include: ["src"],
      exclude: [
        "src/test/**/*",
        "src/features/statistics/**/*",
        ...coverageConfigDefaults.exclude,
      ],
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      server: path.resolve(__dirname, "./src"),
      shared: path.resolve(__dirname, "../shared"),
    },
  },
});
