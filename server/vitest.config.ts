import path from "path";
import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setupTests.ts"],
    testTimeout: 60000,
  },
  resolve: {
    alias: {
      server: path.resolve(__dirname, "./src"),
      shared: path.resolve(__dirname, "../shared"),
    },
  },
});
