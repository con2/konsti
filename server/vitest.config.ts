import path from "node:path";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/test/globalSetup.ts"],
    setupFiles: ["./src/test/setupTests.ts"],
    testTimeout: 60 * 1000,
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
      server: path.resolve(import.meta.dirname, "./src"),
      shared: path.resolve(import.meta.dirname, "../shared"),
    },
  },
});
