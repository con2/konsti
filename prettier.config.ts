import type { Config } from "prettier";

const config: Config = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],

  // Node builtins, npm packages, cross-workspace code, workspace-local
  // absolute imports, relative imports
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "^shared/",
    "^(client|server|playwright|scripts|assets)/",
    "^[.]",
  ],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  // Side-effect imports register mongoose plugins and i18next,
  // so they have to keep their position relative to their dependents
  importOrderSideEffects: false,

  overrides: [
    {
      // Code blocks inside the MDX content pages are illustrative, not real
      // source, so leave them as authored
      files: "client/src/markdown/**",
      options: {
        embeddedLanguageFormatting: "off",
      },
    },
  ],
};

export default config;
