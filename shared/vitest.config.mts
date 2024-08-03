import path from "path";
import { defineConfig } from "vitest/config";

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
