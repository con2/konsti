import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Not the event timezone, so an assertion about Helsinki time fails when the
    // code stops applying it. UTC matches production and CI
    env: { TZ: "UTC" },
    globalSetup: ["./src/test/globalSetup.ts"],
    setupFiles: ["./src/test/setupTests.ts"],
    testTimeout: 60 * 1000,
    hookTimeout: 60 * 1000,
  },
  resolve: {
    alias: {
      server: path.resolve(import.meta.dirname, "./src"),
      shared: path.resolve(import.meta.dirname, "../shared"),
    },
  },
});
