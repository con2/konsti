module.exports = {
  plugins: [
    "stylelint-no-unsupported-browser-features",
    "@double-great/stylelint-a11y",
  ],

  extends: [
    "stylelint-config-standard",
    "@double-great/stylelint-a11y/recommended",
  ],

  customSyntax: "postcss-styled-syntax",

  ignoreFiles: ["build/**/*", "coverage/**/*"],

  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,

  rules: {
    // stylelint
    "media-query-no-invalid": null, // Doesn't work with styled-components
    "shorthand-property-no-redundant-values": null, // Don't want this
    "at-rule-empty-line-before": null, // Don't want this
    "rule-empty-line-before": null, // Don't want this
    "declaration-block-no-redundant-longhand-properties": null, // Don't want this
    "color-function-notation": null, // Don't want this
    "alpha-value-notation": null, // Don't want this
    "declaration-empty-line-before": null, // Don't want this
    "color-function-alias-notation": null, // Don't want this

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
          "css-nesting",
        ],
      },
    ],
  },
};
