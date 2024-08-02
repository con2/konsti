module.exports = {
  /*
  "*.{js,cjs,ts,mts,tsx}": (files) => {
    const filenames = files.join(" ");
    return [`prettier --check ${filenames}`, `eslint ${filenames}`];
  },

  "*.tsx": (files) => {
    const filenames = files.join(" ");
    return [`yarn workspace konsti-client stylelint-lint-staged ${filenames}`];
  },

  "*.{json,mdx,yml}": (files) => {
    const filenames = files.join(" ");
    return [`prettier --check ${filenames}`];
  },
  */

  "{eslint.config.js,package.json}": () => {
    return ["yarn eslint-save-config", "git add **/eslint-config-*"];
  },
};
