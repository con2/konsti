module.exports = {
  processors: ["stylelint-processor-styled-components"],

  plugins: ["stylelint-no-unsupported-browser-features"],

  extends: [
    "stylelint-config-recommended",
    "stylelint-config-styled-components",
    "stylelint-config-prettier",
    "stylelint-a11y/recommended",
  ],

  ignoreFiles: ["build/**/*", "coverage/**/*"],

  rules: {
    // no-unsupported-browser-features
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
        ignore: [
          "flexbox",
          "css3-cursors-newer",
          "css-resize",
          "css-sticky",
          "css-filters",
          "multicolumn",
        ],
      },
    ],
  },
};
