module.exports = {
  ignorePatterns: ['node_modules', 'lib', 'coverage', 'front'],

  plugins: ['eslint-plugin-node'],

  extends: ['plugin:eslint-plugin-node/recommended'],

  env: {
    node: true,
    jest: true,
  },

  rules: {
    // eslint-plugin-node
    'node/no-unsupported-features/es-syntax': 'off', // Import and export declarations are not supported yet
    'node/no-missing-import': 'off', // Not working with babel-plugin-module-resolver and handled by eslint-plugin-import
    'node/no-extraneous-import': 'off', // Doesn't work with Yarn workspace dependencies

    // @typescript-eslint
    '@typescript-eslint/strict-boolean-expressions': 'off', // Forces unwanted code style
    '@typescript-eslint/restrict-template-expressions': 'off', // Requires typing catch(e) every time
    '@typescript-eslint/restrict-plus-operands': 'off', // Doesn't support dynamic object occurance counting
  },
};
