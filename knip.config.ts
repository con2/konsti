import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // netstat/taskkill are the Windows orphan-process cleanup used by scripts/runE2eCoverage.ts
  ignoreBinaries: ["husky", "netstat", "taskkill"],
  ignoreDependencies: [
    // Invoked as `npx c8 report` inside scripts/runE2eCoverage.ts
    "c8",
    "@double-great/stylelint-a11y",
    "postcss",
    "postcss-styled-syntax",
    "postcss-syntax",
    "stylelint-config-standard",
    "stylelint-no-unsupported-browser-features",
  ],
  ignore: [
    ".stylelintrc.ts",
    "playwright/playwright.config.ts",
    "client/src/markdown/prettier.config.ts",
    "server/src/test/scripts/removeInvalidProgramItems.ts",
    "server/src/types/declarations/eventassigner-js.ts",
    ".claude/hooks/*.ts",
  ],

  rules: {
    unlisted: "off",
    unresolved: "off",
    enumMembers: "off",
  },

  workspaces: {
    ".": {
      entry: [
        "shared/config/past-events/*.ts",
        "shared/setupTests.ts",
        "yarn.config.ts",
      ],
    },
    "client/": {
      entry: ["src/index.tsx"],
    },
    "server/": {
      entry: ["src/index.ts"],
    },
  },
};

export default config;
