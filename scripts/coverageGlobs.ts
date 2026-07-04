// Single source of truth for the coverage include/exclude globs used by every
// half of the combined-coverage pipeline (see "Combined Code Coverage" in
// CLAUDE.md): the root vitest.config.ts, the c8 conversion of the server's V8
// coverage (scripts/runE2eCoverage.ts), and the browser instrumentation of the
// client dev server (client/vite.config.ts)
//
// NOTE: consumed by plain-node scripts, so this file must stay free of
// TypeScript syntax that needs transformation (enums, path aliases, ...)

// Repo-root-relative globs
export const coverageInclude = [
  "client/src/**/*.{ts,tsx}",
  "server/src/**/*.ts",
  "shared/**/*.ts",
];

export const coverageExclude = [
  "client/src/test/**",
  "server/src/test/**",
  "server/src/features/statistics/**",
  // Archived event configs are data-as-code: their only consumer is the
  // statistics feature excluded above, so they can never gain coverage
  "shared/config/past-events/**",
  "shared/tests/**",
  "shared/setupTests.ts",
];

const isClientGlob = (glob: string): boolean => glob.startsWith("client/");
const isServerGlob = (glob: string): boolean => glob.startsWith("server/");

// The server process only loads server and shared code
export const serverCoverageInclude = coverageInclude.filter(
  (glob) => !isClientGlob(glob),
);
export const serverCoverageExclude = coverageExclude.filter(
  (glob) => !isClientGlob(glob),
);

// The browser only executes client and shared code
export const clientCoverageInclude = coverageInclude.filter(
  (glob) => !isServerGlob(glob),
);
export const clientCoverageExclude = coverageExclude.filter(
  (glob) => !isServerGlob(glob),
);
