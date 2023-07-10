import path from "path";
import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./setupTests.ts"],
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, "./"),
    },
  },
});
