module.exports = {
  '*.{js,ts,tsx}': (files) => {
    let clientFiles = [];
    let serverFiles = [];
    let sharedFiles = [];

    files.map((file) => {
      if (file.indexOf('client/') !== -1) clientFiles.push(file);
      else if (file.indexOf('server/') !== -1) serverFiles.push(file);
      else sharedFiles.push(file);
    });

    const filenames = files.join(' ');
    const clientFilenames = clientFiles.join(' ');
    const serverFilenames = serverFiles.join(' ');
    const sharedFilenames = sharedFiles.join(' ');

    return [
      `prettier --check ${filenames}`,
      `eslint -c client/.eslintrc.js ${clientFilenames}`,
      `eslint -c server/.eslintrc.js ${serverFilenames}`,
    ];
  },

  '*.{tsx}': (files) => {
    const filenames = files.join(' ');
    return [`stylelint --config client/.stylelintrc.js ${filenames}`];
  },

  '*.{json,md,yml}': (files) => {
    const filenames = files.join(' ');
    return [`prettier --check ${filenames}`];
  },
};
