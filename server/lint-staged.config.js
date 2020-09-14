module.exports = {
  '*.{js,ts}': (files) => {
    const filenames = files.join(' ');
    return [
      `prettier --check ${filenames}`,
      files.length > 10 ? 'eslint .' : `eslint ${filenames}`,
      `jest --bail --findRelatedTests ${filenames}`,
    ];
  },

  '*.{json,md,yml}': (files) => {
    const filenames = files.join(' ');
    return [`prettier --check ${filenames}`];
  },
};
