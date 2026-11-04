import path from "node:path";
import { defineConfig } from "vitest/config";
import { TIMEZONE } from "../shared/utils/timezone.ts";

// The process itself, not only the test workers: the global setup seeds the
// program items, whose whole hours must be the event's own
process.env.TZ = TIMEZONE;

// The real-device checks as a vitest run of their own: not a project of the
// root config, so `yarn test` never spends BrowserStack minutes. Run with
// `yarn browserstack:test`.
export default defineConfig({
  // Next to the other vitest caches rather than in a node_modules of its own
  // under this directory, which `root` would otherwise create
  cacheDir: path.resolve(
    import.meta.dirname,
    "../node_modules/.vite/browserstack",
  ),
  test: {
    root: import.meta.dirname,
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // One line per scenario with its logged verdict, also when the output is
    // not a terminal
    reporters: ["verbose"],
    globalSetup: ["./globalSetup.ts"],
    // A scenario waits up to 90 s away and up to 75 s for a tick, and a
    // session's first one also boots the app on the phone
    testTimeout: 600_000,
    hookTimeout: 120_000,
    // One test file whose scenarios all start at once: one waiting for its
    // session's turn still holds a slot, so a lower limit would hold back the
    // other sessions
    fileParallelism: false,
    maxConcurrency: 8,
  },
  resolve: {
    alias: {
      shared: path.resolve(import.meta.dirname, "../shared"),
    },
  },
});
