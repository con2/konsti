import path from "node:path";
import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
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
      client: path.resolve(__dirname, "./src"),
      shared: path.resolve(__dirname, "../shared"),
    },
  },
});
