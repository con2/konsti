module.exports = {
  plugins: ["stylelint-no-unsupported-browser-features"],

  extends: [
    "stylelint-config-recommended",
    "stylelint-config-prettier",
    "@ronilaukkarinen/stylelint-a11y/recommended",
  ],

  customSyntax: "@stylelint/postcss-css-in-js",

  ignoreFiles: ["build/**/*", "coverage/**/*"],

  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,

  rules: {
    // stylelint
    "length-zero-no-unit": true,
    "media-feature-name-no-unknown": null, // Doesn't work with styled-components media queries
    "function-no-unknown": null, // Doesn't work with styled-components

    // no-unsupported-browser-features
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
        ignorePartialSupport: true,
        ignore: [
          "css-resize",
          "css-sticky",
          "css3-cursors-newer",
          "css3-cursors",
        ],
      },
    ],
  },
};
