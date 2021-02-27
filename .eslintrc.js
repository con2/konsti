module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  plugins: [],

  extends: [],

  settings: {
    'import/resolver': {
      'babel-module': {
        babelOptions: { rootMode: 'upward' },
      },
    },
  },

  rules: {},
};
