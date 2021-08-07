module.exports = {
  "*.{js,ts,tsx}": (files) => {
    const filenames = files.join(" ");
    return [`prettier --check ${filenames}`, `eslint ${filenames}`];
  },

  "*.tsx": (files) => {
    const filenames = files.join(" ");
    return [`stylelint --config client/.stylelintrc.js ${filenames}`];
  },

  "*.{json,md,yml}": (files) => {
    const filenames = files.join(" ");
    return [`prettier --check ${filenames}`];
  },
};
