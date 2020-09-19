module.exports = {
  root: true,

  parser: '@typescript-eslint/parser', // or 'babel-eslint'

  plugins: [
    'eslint-plugin-compat',
    'eslint-plugin-jest',
    'eslint-plugin-prettier',
    'eslint-plugin-promise',
    'eslint-plugin-react-hooks',
    'eslint-plugin-import',
    '@typescript-eslint',
    // 'eslint-plugin-jsx-a11y',
    // 'eslint-plugin-security',
    // 'eslint-plugin-unicorn',
  ],

  extends: [
    'eslint-config-standard-with-typescript',
    'eslint-config-prettier',
    'eslint-config-prettier/react',
    'eslint-config-prettier/standard',
    'eslint-config-prettier/@typescript-eslint',
    'plugin:eslint-plugin-eslint-comments/recommended',
    'plugin:eslint-plugin-jest/recommended',
    'plugin:eslint-plugin-promise/recommended',
    'plugin:eslint-plugin-react/recommended',
    'plugin:eslint-plugin-import/errors',
    'plugin:eslint-plugin-import/typescript',
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // 'plugin:eslint-plugin-jsx-a11y/recommended',
    // 'plugin:eslint-plugin-security/recommended',
    // 'plugin:eslint-plugin-unicorn/recommended',
  ],

  ignorePatterns: ['node_modules', 'build', 'coverage'],

  parserOptions: {
    sourceType: 'module',
    impliedStrict: true,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },

  env: {
    es6: true,
    browser: true,
    jest: true,
  },

  settings: {
    react: {
      version: 'detect',
    },
    polyfills: ['Promise', 'Array.from', 'Object.entries'],
    'import/resolver': {
      'babel-module': {},
    },
  },

  rules: {
    // eslint
    'no-param-reassign': 'error',

    // eslint-plugin-react
    'react/no-unescaped-entities': 'off',

    // eslint-plugin-react-hooks
    'react-hooks/rules-of-hooks': 'error',

    // eslint-plugin-prettier
    'prettier/prettier': 'error',

    // eslint-plugin-compat
    'compat/compat': 'error',

    // eslint-plugin-import
    'import/no-unused-modules': ['error', { unusedExports: true }],
    'import/no-unresolved': 'off',

    // eslint-plugin-eslint-comments
    'eslint-comments/no-unused-disable': 'error',

    // @typescript-eslint
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/require-array-sort-compare': [
      'error',
      { ignoreStringArrays: true },
    ],
    '@typescript-eslint/default-param-last': 'off', // Problem setting Redux reducer initial state

    // TODO: Enable these
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
};
