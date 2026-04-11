import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreBinaries: ["husky"],
  ignoreDependencies: [
    "browserslist",
    "@svgr/webpack",
    "@babel/cli",
    "@babel/node",
    "@double-great/stylelint-a11y",
    "@types/dotenv-webpack",
    "@types/mdx",
    "babel-loader",
    "file-loader",
    "postcss",
    "postcss-styled-syntax",
    "postcss-syntax",
    "raw-loader",
    "stylelint-config-standard",
    "stylelint-no-unsupported-browser-features",
  ],
  ignore: [
    ".stylelintrc.js",
    "shared/config/past-events/*.ts",
    "playwright/playwright.config.ts",
    "client/src/markdown/.prettierrc.js",
    "server/src/test/scripts/removeInvalidProgramItems.ts",
    "server/src/types/declarations/eventassigner-js.ts",
    "server/src/test/globalSetup.ts",
    ".claude/hooks/*.ts",
  ],

  rules: {
    unlisted: "off",
    unresolved: "off",
    enumMembers: "off",
  },

  workspaces: {
    ".": {
      entry: ["eslint-rules/*.ts", "shared/setupTests.ts"],
    },
    "client/": {
      entry: ["src/index.tsx", "webpack.config.ts"],
    },
    "server/": {
      entry: ["src/index.ts"],
    },
  },
};

export default config;
