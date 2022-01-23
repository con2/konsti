module.exports = {
  plugins: ["stylelint-no-unsupported-browser-features"],

  extends: [
    "stylelint-config-recommended",
    "stylelint-config-prettier",
    "stylelint-a11y/recommended",
  ],

  ignoreFiles: ["build/**/*", "coverage/**/*"],

  rules: {
    // stylelint
    "length-zero-no-unit": true,
    "media-feature-name-no-unknown": null, // Doesn't work with styled-component media queries

    // TODO: Enable this, broken at the moment
    // no-unsupported-browser-features
    /*
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
        ignorePartialSupport: true,
        ignore: ["css-resize", "css-sticky", "css3-cursors-newer"],
      },
    ],
    */
  },
};
