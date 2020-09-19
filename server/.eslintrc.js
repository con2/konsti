module.exports = {
  root: true,

  parser: '@typescript-eslint/parser', // or 'babel-eslint'

  plugins: [
    'eslint-plugin-jest',
    'eslint-plugin-node',
    'eslint-plugin-prettier',
    'eslint-plugin-promise',
    'eslint-plugin-standard',
    'eslint-plugin-import',
    '@typescript-eslint',
    // 'eslint-plugin-security',
    // 'eslint-plugin-unicorn',
  ],

  extends: [
    'eslint-config-standard-with-typescript',
    'eslint-config-prettier',
    'eslint-config-prettier/standard',
    'eslint-config-prettier/@typescript-eslint',
    'plugin:eslint-plugin-eslint-comments/recommended',
    'plugin:eslint-plugin-jest/recommended',
    'plugin:eslint-plugin-node/recommended',
    'plugin:eslint-plugin-promise/recommended',
    'plugin:eslint-plugin-import/errors',
    'plugin:eslint-plugin-import/typescript',
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // 'plugin:eslint-plugin-security/recommended',
    // 'plugin:eslint-plugin-unicorn/recommended',
  ],

  ignorePatterns: ['node_modules', 'lib', 'coverage', 'front'],

  parserOptions: {
    sourceType: 'module',
    impliedStrict: true,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },

  env: {
    node: true,
    jest: true,
  },

  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },

  rules: {
    // eslint
    'no-param-reassign': 'error',
    'no-console': 'error',

    // eslint-plugin-prettier
    'prettier/prettier': 'error',

    // eslint-plugin-node
    'node/no-unsupported-features/es-syntax': 'off', // Import and export declarations are not supported yet
    'node/no-missing-import': 'off', // Not working with babel-plugin-module-resolver and handled by eslint-plugin-import

    // eslint-plugin-import
    'import/no-unused-modules': ['error', { unusedExports: true }],

    // eslint-plugin-eslint-comments
    'eslint-comments/no-unused-disable': 'error',

    // @typescript-eslint
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off', // Forces unwanted code style
    '@typescript-eslint/restrict-template-expressions': 'off', // Requires typing catch(e) every time
    '@typescript-eslint/restrict-plus-operands': 'off', // Doesn't support dynamic object occurance counting
  },
};
