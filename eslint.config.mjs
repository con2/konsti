// @ts-check
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginBan from "eslint-plugin-ban";
import eslintPluginCommentsConfigs from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslintPluginCompat from "eslint-plugin-compat";
import eslintPluginDeprecation from "eslint-plugin-deprecation";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginPromise from "eslint-plugin-promise";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginVitest from "eslint-plugin-vitest";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import { fixupPluginRules } from "@eslint/compat";

export default typescriptEslint.config(
  ...typescriptEslint.configs.strictTypeChecked,
  ...typescriptEslint.configs.stylisticTypeChecked,
  eslintPluginCommentsConfigs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  eslintPluginPromise.configs["flat/recommended"],

  // Default
  {
    languageOptions: {
      // sourceType: "module",
      // ecmaVersion: 2021,
      // parser: typescriptEslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "lint-staged.config.js",
            "yarn.config.cjs",
            "client/babel.config.js",
          ],
          defaultProject: "./tsconfig.json",
        },
        // impliedStrict: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    ignores: [
      "**/.*", // Ignore dotfiles
      "**/lib/**",
      "**/coverage/**",
      "**/front/**",
      "**/build/**",
    ],
  },
  {
    plugins: {
      ban: fixupPluginRules(eslintPluginBan),
      compat: eslintPluginCompat,
      vitest: eslintPluginVitest,
      prettier: eslintPluginPrettier,
      promise: eslintPluginPromise,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      import: fixupPluginRules(eslintPluginImport),
      "@typescript-eslint": typescriptEslint.plugin,
      unicorn: eslintPluginUnicorn,
      deprecation: fixupPluginRules(eslintPluginDeprecation),
      "import/parsers": typescriptEslint.parser,
    },

    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/internal-regex": "shared",
    },

    rules: {
      ...eslintPluginVitest.configs.recommended.rules,
      ...eslintPluginImport.configs.typescript.rules,

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
      ],
      "no-else-return": "error",
      curly: "error",
      "no-constant-binary-expression": "error",
      "array-callback-return": "off",
      "no-shadow": "off", // Required by @typescript-eslint/no-shadow

      // eslint-plugin-prettier
      "prettier/prettier": "error",

      // eslint-plugin-import
      // TODO: Enable, doesn't work with flat config yet https://github.com/import-js/eslint-plugin-import/issues/2964
      // "import/no-unused-modules": ["error", { unusedExports: true }],
      "import/no-unresolved": "off",
      "import/order": ["error", { groups: ["builtin", "external"] }],
      "import/no-namespace": [
        "error",
        {
          ignore: [
            "padgAssignment", // Needs wildcard import for vi.spyon
            "randomAssignment", // Needs wildcard import for vi.spyon
            "signupTimes", // Needs wildcard import for vi.spyon
          ],
        },
      ], // Don't want to use namespace imports
      "import/namespace": "off", // Don't want to use namespace imports

      // eslint-plugin-vitest
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/prefer-to-be": "off", // Don't want this
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "assertSignupTime"] },
      ],

      // @typescript-eslint
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-explicit-any": "error",
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
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 3,
        },
      ],
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple",
        },
      ],
      "@typescript-eslint/strict-boolean-expressions": "off", // Forces unwanted code style
      "@typescript-eslint/restrict-template-expressions": "off", // Requires typing catch(e) every time
      "@typescript-eslint/restrict-plus-operands": "off", // Doesn't support dynamic object occurance counting
      "@typescript-eslint/key-spacing": "off", // Formatting handled by prettier

      // eslint-plugin-ban
      "ban/ban": [
        "error",
        { name: "useDispatch", message: "Please use useAppDispatch()" },
        { name: "useSelector", message: "Please use useAppSelector()" },
      ],

      // eslint-plugin-deprecation
      "deprecation/deprecation": "error",

      // TODO: Enable these rules
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/consistent-type-imports": "off", // Tooling lacking, try again once TS 5.0 is released: https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#verbatimmodulesyntax
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Client
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  {
    files: ["**/*.tsx"],

    ...eslintPluginReact.configs.flat["jsx-runtime"].recommended,
    ...eslintPluginJsxA11y.flatConfigs.recommended,

    plugins: {
      react: eslintPluginReact,
      "react-hooks": fixupPluginRules(eslintPluginReactHooks),
      compat: eslintPluginCompat,
      "jsx-a11y": eslintPluginJsxA11y,
    },

    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      // eslint-plugin-react
      "react/no-multi-comp": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/forbid-elements": [
        "error",
        { forbid: [{ element: "button", message: "use <Button> instead" }] },
      ],
      "react/no-unescaped-entities": "off",

      // eslint-plugin-react-hooks
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // eslint-plugin-compat
      "compat/compat": "error",

      // "eslint-plugin-jsx-a11y",
      "jsx-a11y/no-onchange": "off", // TODO: Enable

      // @typescript-eslint
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false, // https://github.com/typescript-eslint/typescript-eslint/pull/4623
            arguments: false, // Some functions like setInterval expect a callback function parameter with void return
          },
        },
      ],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],

      "@typescript-eslint/default-param-last": "off", // Problem setting Redux reducer initial state
      "@typescript-eslint/no-floating-promises": "off", // TODO: Enable
    },
  },

  // Server
  {
    files: ["server/**"],

    plugins: { n: eslintPluginN },

    ...eslintPluginN.configs["flat/recommended-module"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      // eslint-plugin-n
      "n/no-unpublished-import": "off", // Gives error when tests are in same folder as tested code
      "n/no-unsupported-features/es-syntax": "off", // Import and export declarations are not supported yet
      "n/no-missing-import": "off", // Handled by tsc
      "n/no-extraneous-import": "off", // Doesn't work with Yarn workspace dependencies

      // @typescript-eslint
      "@typescript-eslint/strict-boolean-expressions": "off", // Forces unwanted code style
      "@typescript-eslint/restrict-template-expressions": "off", // Requires typing catch(e) every time
      "@typescript-eslint/restrict-plus-operands": "off", // Doesn't support dynamic object occurance counting
    },
  },

  eslintConfigPrettier,
);
