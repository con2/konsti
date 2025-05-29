import path from "node:path";
import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./setupTests.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, "./"),
    },
  },
});
