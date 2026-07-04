import { coverageConfigDefaults, defineConfig } from "vitest/config";
import { coverageExclude, coverageInclude } from "./scripts/coverageGlobs";

export default defineConfig({
  test: {
    projects: [
      "client/vitest.config.ts",
      "server/vitest.config.ts",
      "shared/vitest.config.ts",
    ],
    // Coverage settings for `vitest run --coverage` (`yarn coverage:vitest`),
    // which covers all projects in one pass and feeds the combined report
    // built by `yarn coverage` (scripts/mergeCoverageReport.ts). This is the
    // only coverage config: in projects mode vitest reads coverage settings
    // from the root config only
    coverage: {
      provider: "istanbul",
      include: coverageInclude,
      exclude: [...coverageExclude, ...coverageConfigDefaults.exclude],
      reporter: ["text", "json"],
      // Write the coverage json even when tests fail, so a failing run still
      // feeds a (partial) combined report
      reportOnFailure: true,
      reportsDirectory: "./coverage/vitest",
    },
  },
});
