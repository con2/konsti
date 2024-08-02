module.exports = {
  ignorePatterns: ["node_modules", "lib", "coverage", "front"],

  plugins: ["eslint-plugin-n"],

  extends: ["plugin:eslint-plugin-n/recommended"],

  env: {
    node: true,
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
};
