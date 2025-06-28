import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
// @ts-expect-error: Missing types
import eslintPluginCommentsConfigs from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslintPluginCompat from "eslint-plugin-compat";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// @ts-expect-error: Missing types
import eslintPluginPromise from "eslint-plugin-promise";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactHooksAddon from "eslint-plugin-react-hooks-addons";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginVitest from "@vitest/eslint-plugin";
// @ts-expect-error: Missing types
import eslintPluginOnlyError from "eslint-plugin-only-error";
// eslint-disable-next-line import/no-namespace
import * as eslintPluginMdx from "eslint-plugin-mdx";
import typescriptEslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import { noUselessTemplateLiteral } from "./eslint-rules/noUselessTemplateLiteral";

const filetypesGlob = "**/*.{ts,tsx,cts,mts,js,cjs,mjs}";

// @ts-expect-error: import.met not allowed
const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

// eslint-disable-next-line import/no-unused-modules
export default defineConfig([
  eslint.configs.recommended,
  typescriptEslint.configs.strictTypeChecked,
  typescriptEslint.configs.stylisticTypeChecked,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  eslintPluginCommentsConfigs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  eslintPluginPromise.configs["flat/recommended"],
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  eslintPluginUnicorn.configs.recommended,

  includeIgnoreFile(gitignorePath),

  globalIgnores([
    "**/.*", // Ignore dotfiles
    "**/coverage/**",
    "**/front/**",
    "**/build/**",
    "client/babel.config.js",
    "client/babel.config.js",
  ]),

  // ** Default **
  {
    files: [filetypesGlob],

    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["yarn.config.cjs"],
          defaultProject: "./tsconfig.json",
        },
        // @ts-expect-error: import.met not allowed
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },

  {
    plugins: {
      vitest: eslintPluginVitest,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      onlyError: eslintPluginOnlyError,
      custom: {
        rules: {
          "no-useless-template-literal": noUselessTemplateLiteral,
        },
      },
    },

    settings: {
      "import/resolver": {
        typescript: true,
      },
      // Regex for packages that should be treated as internal
      "import/internal-regex": "shared",
      "import/parsers": {
        "eslint-mdx": [".mdx"],
      },
    },

    linterOptions: {
      reportUnusedInlineConfigs: "error",
      reportUnusedDisableDirectives: "error",
    },

    rules: {
      ...eslintPluginVitest.configs.recommended.rules,

      // Custom rules in eslint-rules directory
      "custom/no-useless-template-literal": "error",

      // eslint
      "no-param-reassign": "error",
      "no-console": "error",
      "object-shorthand": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement", // We don't throw errors!
          message: "Return Result<T,Err> instead of throwing errors",
        },
        {
          selector: "MemberExpression[property.name='format']",
          message: "Import from timeFormatter.ts or use dayjs().toISOString",
        },
        {
          selector: "CallExpression[callee.name='useDispatch']",
          message: "Please use useAppDispatch()",
        },
        {
          selector: "CallExpression[callee.name='useSelector']",
          message: "Please use useAppSelector()",
        },
      ],
      "no-else-return": "error",
      curly: "error",
      "no-implicit-coercion": ["error", { boolean: false }],

      // eslint-plugin-import
      "import/no-unused-modules": ["error", { unusedExports: true }],
      "import/order": ["error", { groups: ["builtin", "external"] }],
      "import/no-namespace": [
        "error",
        {
          ignore: [
            "padgAssignment", // Needs wildcard import for vi.spyOn()
            "randomAssignment", // Needs wildcard import for vi.spyOn()
            "signupTimes", // Needs wildcard import for vi.spyOn()
          ],
        },
      ], // Don't want to use namespace imports
      "import/no-unresolved": ["error", { ignore: [String.raw`.gif$`] }],

      "import/namespace": "off", // Don't want to use namespace imports
      "import/no-named-as-default": "off", // Doesn't work with styled-components
      "import/no-named-as-default-member": "off", // Doesn't work with i18next.use()
      "import/default": "off", // Doesn't work with prettier default import

      // @vitest/eslint-plugin
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "assertSignupTime"] },
      ],

      // eslint-plugin-unicorn
      "unicorn/prefer-top-level-await": "off", // Top-level await not supported
      "unicorn/prefer-module": "off", // import.meta not supported
      "unicorn/no-array-reduce": "off", // Don't want this
      "unicorn/numeric-separators-style": "off", // Don't want this
      "unicorn/switch-case-braces": "off", // Don't want this
      "unicorn/no-lonely-if": "off", // Don't want this
      "unicorn/no-null": "off", // Don't want this
      "unicorn/prevent-abbreviations": "off", // Don't want this
      "unicorn/filename-case": "off", // Don't want this

      // @typescript-eslint
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "@typescript-eslint/require-array-sort-compare": [
        "error",
        { ignoreStringArrays: true },
      ],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { vars: "all", args: "all", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Please use named imports, e.g. { useEffect }",
            },
          ],
          patterns: [
            {
              group: ["../*"],
              message: "Relative import (../) not allowed, use absolute import",
            },
          ],
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowTernary: true },
      ],
    },
  },

  // ** Client **
  {
    files: [`client/${filetypesGlob}`],

    extends: [
      // 'recommended' configuration is not recommended anymore, use 'all' and disable some rules
      eslintPluginReact.configs.flat.all,
      // Disable some rules conflicting with new JSX transform from React 17
      eslintPluginReact.configs.flat["jsx-runtime"],
      eslintPluginReactHooksAddon.configs.recommended,
      eslintPluginJsxA11y.flatConfigs.recommended,
      eslintPluginCompat.configs["flat/recommended"],
    ],

    plugins: {
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      // eslint-plugin-react
      "react/forbid-elements": [
        "error",
        { forbid: [{ element: "button", message: "use <Button> instead" }] },
      ],
      "react/function-component-definition": "off",
      "react/jsx-filename-extension": "off",
      "react/jsx-no-leaked-render": "off",
      "react/jsx-no-bind": "off",
      "react/jsx-sort-props": "off",
      "react/jsx-max-depth": "off",
      "react/jsx-curly-brace-presence": "off",
      "react/jsx-props-no-spreading": "off",
      "react/jsx-no-literals": "off",
      "react/prefer-read-only-props": "off",
      "react/jsx-boolean-value": "off",
      "react/require-default-props": "off",
      "react/no-unused-prop-types": "off",
      "react/destructuring-assignment": "off",
      "react/forbid-component-props": "off",

      // eslint-plugin-react-hooks
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",

      // eslint-plugin-react-hooks-addons
      "react-hooks-addons/no-unused-deps": "error",

      // @typescript-eslint
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false, // https://github.com/typescript-eslint/typescript-eslint/pull/4623
          },
        },
      ],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],
    },
  },

  // ** Server **
  {
    files: [`server/${filetypesGlob}`],

    extends: [eslintPluginN.configs["flat/recommended"]],

    rules: {
      // eslint-plugin-n
      "n/no-missing-import": "off", // Handled by tsc
      "n/no-extraneous-import": "off", // Doesn't work with Yarn workspace dependencies
    },
  },

  // ** MDX support **
  {
    files: ["**/*.mdx"],

    ...eslintPluginMdx.flat,

    extends: [
      eslintPluginReact.configs.flat.all,
      eslintPluginReact.configs.flat["jsx-runtime"],
      typescriptEslint.configs.disableTypeChecked,
    ],

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      // eslint
      "no-undef": "off",

      // eslint-plugin-react
      "react/jsx-filename-extension": "off",
      "react/jsx-no-literals": "off",
      "react/jsx-max-depth": "off",
      "react/jsx-curly-brace-presence": "off",
      "react/no-unescaped-entities": "off",
      "react/self-closing-comp": "off",
    },
  },

  // ** eslint-config-prettier **
  eslintPluginPrettierRecommended,
]);
