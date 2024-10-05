// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import eslintPluginBan from "eslint-plugin-ban";
import eslintPluginCommentsConfigs from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslintPluginCompat from "eslint-plugin-compat";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginPromise from "eslint-plugin-promise";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactHooksAddon from "eslint-plugin-react-hooks-addons";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginVitest from "eslint-plugin-vitest";
import eslintPluginOnlyError from "eslint-plugin-only-error";
import typescriptEslint from "typescript-eslint";
import { fixupPluginRules } from "@eslint/compat";

export default typescriptEslint.config(
  eslint.configs.recommended,
  ...typescriptEslint.configs.strictTypeChecked,
  ...typescriptEslint.configs.stylisticTypeChecked,
  eslintPluginCommentsConfigs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  eslintPluginPromise.configs["flat/recommended"],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  eslintPluginImport.flatConfigs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  eslintPluginImport.flatConfigs.typescript,

  // ** Default **
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mjs",
            "yarn.config.cjs",
            "client/babel.config.js",
          ],
          defaultProject: "./tsconfig.json",
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },

  {
    ignores: [
      "**/.*", // Ignore dotfiles
      "**/coverage/**",
      "**/front/**",
      "**/build/**",
    ],
  },
  {
    plugins: {
      ban: fixupPluginRules(eslintPluginBan),
      vitest: eslintPluginVitest,
      unicorn: eslintPluginUnicorn,
      onlyError: eslintPluginOnlyError,
    },

    settings: {
      "import/resolver": {
        typescript: true,
      },
      // Regex for packages that should be treated as internal
      "import/internal-regex": "shared",
    },

    rules: {
      ...eslintPluginVitest.configs.recommended.rules,

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

      // eslint-plugin-import
      // TODO: Enable, doesn't work with flat config yet https://github.com/import-js/eslint-plugin-import/issues/2964
      // "import/no-unused-modules": ["error", { unusedExports: true }],
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
      "import/no-unresolved": ["error", { ignore: ["\\.gif$"] }],

      "import/namespace": "off", // Don't want to use namespace imports
      "import/no-named-as-default": "off", // Doesn't work with styled-components
      "import/no-named-as-default-member": "off", // Doesn't work with i18next.use()
      "import/default": "off", // Doesn't work with prettier default import

      // eslint-plugin-vitest
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["expect", "assertSignupTime"] },
      ],

      // eslint-plugin-ban
      "ban/ban": [
        "error",
        { name: "useDispatch", message: "Please use useAppDispatch()" },
        { name: "useSelector", message: "Please use useAppSelector()" },
      ],

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
        { allowArray: true, allowNumber: true },
      ],
      "@typescript-eslint/no-deprecated": "error",
    },
  },

  // ** Client **
  {
    files: ["client/**"],

    extends: [
      // 'recommended' configuration is not recommended anymore, use 'all' and disable some rules
      eslintPluginReact.configs.flat.all,
      // Disable some rules conflicting with new JSX transform from React 17
      eslintPluginReact.configs.flat["jsx-runtime"],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      eslintPluginJsxA11y.flatConfigs.recommended,
      eslintPluginCompat.configs["flat/recommended"],
    ],

    plugins: {
      react: eslintPluginReact,
      "react-hooks": fixupPluginRules(eslintPluginReactHooks),
      "react-hooks-addons": fixupPluginRules(eslintPluginReactHooksAddon),
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
    files: ["server/**"],

    extends: [eslintPluginN.configs["flat/recommended"]],

    rules: {
      // eslint-plugin-n
      "n/no-missing-import": "off", // Handled by tsc
      "n/no-extraneous-import": "off", // Doesn't work with Yarn workspace dependencies
    },
  },

  // Enables eslint-config-prettier
  eslintPluginPrettierRecommended,
);
