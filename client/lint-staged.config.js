module.exports = {
  '*.{js,ts,tsx}': (files) => {
    const filenames = files.join(' ');
    return [
      `prettier --check ${filenames}`,
      files.length > 10 ? 'eslint .' : `eslint ${filenames}`,
      `stylelint ${filenames}`,
      `jest --bail --findRelatedTests ${filenames}`,
    ];
  },

  '*.{json,md,yml}': (files) => {
    const filenames = files.join(' ');
    return [`prettier --check ${filenames}`];
  },
};
