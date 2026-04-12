import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    exclude: ["playwright"],
    coverage: {
      provider: "istanbul",
      include: ["src"],
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      client: path.resolve(import.meta.dirname, "./src"),
      shared: path.resolve(import.meta.dirname, "../shared"),
    },
  },
});
