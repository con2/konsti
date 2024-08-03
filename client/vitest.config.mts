import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    exclude: ["playwright"],
  },
  resolve: {
    alias: {
      client: path.resolve(__dirname, "./src"),
      shared: path.resolve(__dirname, "../shared"),
    },
  },
});
