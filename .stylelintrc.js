module.exports = {
  plugins: ["stylelint-no-unsupported-browser-features"],

  extends: [
    "stylelint-config-recommended",
    "@ronilaukkarinen/stylelint-a11y/recommended",
  ],

  customSyntax: "postcss-styled-syntax",

  ignoreFiles: ["build/**/*", "coverage/**/*"],

  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,

  rules: {
    // stylelint
    "length-zero-no-unit": true,
    "media-query-no-invalid": null, // Doesn't work with styled-components

    // no-unsupported-browser-features
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
        ignorePartialSupport: true,
        ignore: [
          "css-resize",
          "css3-cursors",
          "css-math-functions",
          "css-focus-visible",
        ],
      },
    ],
  },
};
