module.exports = {
  '*.{js,ts,tsx}': (files) => {
    const filenames = files.join(' ');

    let clientFiles = [];
    let serverFiles = [];
    let sharedFiles = [];

    files.map((file) => {
      if (file.indexOf('client/') !== -1) clientFiles.push(file);
      else if (file.indexOf('server/') !== -1) serverFiles.push(file);
      else sharedFiles.push(file);
    });

    return [
      `prettier --check ${filenames}`,
      `eslint -c client/.eslintrc.js ${clientFiles}`,
      `eslint -c server/.eslintrc.js ${serverFiles}`,
      // `eslint -c server/.eslintrc.js ${sharedFiles}`,
      // `stylelint ${filenames}`,
      // `jest --bail --findRelatedTests ${filenames}`,
    ];
  },

  '*.{json,md,yml}': (files) => {
    const filenames = files.join(' ');
    return [`prettier --check ${filenames}`];
  },
};
