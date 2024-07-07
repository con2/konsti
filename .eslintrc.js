module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  plugins: [
    "eslint-plugin-ban",
    "eslint-plugin-compat",
    "eslint-plugin-vitest",
    "eslint-plugin-prettier",
    "eslint-plugin-promise",
    "eslint-plugin-import",
    "@typescript-eslint",
    "eslint-plugin-unicorn",
    "eslint-plugin-deprecation",
  ],

  extends: [
    "eslint-config-prettier",
    "plugin:eslint-plugin-eslint-comments/recommended",
    "plugin:eslint-plugin-vitest/recommended",
    "plugin:eslint-plugin-promise/recommended",
    "plugin:eslint-plugin-import/errors",
    "plugin:eslint-plugin-import/typescript",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],

  env: {
    es2021: true,
  },

  parserOptions: {
    sourceType: "module",
    impliedStrict: true,
    tsconfigRootDir: __dirname,
    project: true,
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
    "import/no-unused-modules": ["error", { unusedExports: true }],
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

    // eslint-plugin-eslint-comments
    "eslint-comments/no-unused-disable": "error",

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
    "@typescript-eslint/ban-types": [
      "off",
      {
        extendDefaults: false,
        types: {
          String: {
            message: "Use string instead",
            fixWith: "string",
          },
          Boolean: {
            message: "Use boolean instead",
            fixWith: "boolean",
          },
          Number: {
            message: "Use number instead",
            fixWith: "number",
          },
          Symbol: {
            message: "Use symbol instead",
            fixWith: "symbol",
          },
          BigInt: {
            message: "Use bigint instead",
            fixWith: "bigint",
          },
          Function: {
            message:
              "The `Function` type accepts any function-like value.\nIt provides no type safety when calling the function, which can be a common source of bugs.\nIt also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.\nIf you are expecting the function to accept certain arguments, you should explicitly define the function shape.",
          },
          Object: {
            message:
              'The `Object` type actually means "any non-nullish value", so it is marginally better than `unknown`.\n- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.\n- If you want a type meaning "any value", you probably want `unknown` instead.',
          },
          "{}": {
            message:
              '`{}` actually means "any non-nullish value".\n- If you want a type meaning "any object", you probably want `Record<string, unknown>` instead.\n- If you want a type meaning "any value", you probably want `unknown` instead.',
          },
        },
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
  },
};
