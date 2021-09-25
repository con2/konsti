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

    // eslint-plugin-compat
    "compat/compat": "error",

    // eslint-plugin-jest
    "jest/no-done-callback": "off",

    // @typescript-eslint
    "@typescript-eslint/no-var-requires": "off", // Used to dynamically import dev dependencies
    "@typescript-eslint/default-param-last": "off", // Problem setting Redux reducer initial state

    // TODO: Enable these rules
    "@typescript-eslint/no-floating-promises": "off",
    "jsx-a11y/no-onchange": "off",
  },
};
