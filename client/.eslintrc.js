module.exports = {
  ignorePatterns: ["node_modules", "build", "coverage"],

  plugins: [
    "eslint-plugin-compat",
    "eslint-plugin-react-hooks",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-testing-library",
  ],

  extends: [
    "plugin:eslint-plugin-react/recommended",
    "plugin:eslint-plugin-jsx-a11y/recommended",
    "plugin:testing-library/react",
    "plugin:react-hooks/recommended",
  ],

  env: {
    browser: true,
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
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",

    // eslint-plugin-compat
    "compat/compat": "error",

    // eslint-plugin-testing-library
    "testing-library/no-unnecessary-act": "off", // Gives false positives

    // "eslint-plugin-jsx-a11y",
    "jsx-a11y/no-onchange": "off", // TODO: Enable

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

    "@typescript-eslint/no-var-requires": "off", // Used to dynamically import dev dependencies
    "@typescript-eslint/default-param-last": "off", // Problem setting Redux reducer initial state
    "@typescript-eslint/no-floating-promises": "off", // TODO: Enable
  },
};
