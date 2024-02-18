module.exports = {
  plugins: [
    "stylelint-no-unsupported-browser-features",
    "@double-great/stylelint-a11y",
  ],

  extends: [
    "stylelint-config-recommended",
    // Recommended config doesn't work: https://github.com/double-great/stylelint-a11y/issues/65
    // "@double-great/stylelint-a11y/recommended",
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

    // @double-great/stylelint-a11y
    // Same rules as in recommended config - enable single rules since config doesn't work
    "a11y/media-prefers-reduced-motion": true,
    "a11y/no-outline-none": true,
    "a11y/selector-pseudo-class-focus": true,

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
