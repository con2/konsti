import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Not the event timezone, so an assertion about Helsinki time fails when the
    // code stops applying it. UTC matches the server and CI
    env: { TZ: "UTC" },
    // Node 25+ defines a localStorage global that is undefined without
    // --localstorage-file, and vitest keeps it in place of jsdom's storage
    execArgv: ["--no-experimental-webstorage"],
    setupFiles: ["./src/test/setupTests.ts"],
    exclude: ["playwright"],
  },
  resolve: {
    alias: {
      client: path.resolve(import.meta.dirname, "./src"),
      shared: path.resolve(import.meta.dirname, "../shared"),
    },
  },
});
