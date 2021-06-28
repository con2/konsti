module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  plugins: [
    'eslint-plugin-ban',
    'eslint-plugin-compat',
    'eslint-plugin-jest',
    'eslint-plugin-prettier',
    'eslint-plugin-promise',
    'eslint-plugin-import',
    '@typescript-eslint',
    'eslint-plugin-unicorn',
  ],

  extends: [
    'eslint-config-standard-with-typescript',
    'eslint-config-prettier',
    'plugin:eslint-plugin-eslint-comments/recommended',
    'plugin:eslint-plugin-jest/recommended',
    'plugin:eslint-plugin-promise/recommended',
    'plugin:eslint-plugin-import/errors',
    'plugin:eslint-plugin-import/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],

  env: {
    es2021: true,
    jest: true,
  },

  parserOptions: {
    sourceType: 'module',
    impliedStrict: true,
    tsconfigRootDir: __dirname,
    project: [
      'tsconfig.json',
      'client/tsconfig.json',
      'client/cypress/tsconfig.json',
      'server/tsconfig.json',
    ],
  },

  settings: {
    'import/resolver': {
      'babel-module': {
        babelOptions: { rootMode: 'upward' },
      },
    },
    'import/internal-regex': 'shared',
  },

  rules: {
    // eslint
    'no-param-reassign': 'error',
    'no-restricted-imports': ['error', { patterns: ['../*'] }],
    'no-console': 'error',
    'array-callback-return': 'off',
    'no-shadow': 'off', // Required by @typescript-eslint/no-shadow

    // eslint-plugin-prettier
    'prettier/prettier': 'error',

    // eslint-plugin-import
    'import/no-unused-modules': ['error', { unusedExports: true }],
    'import/no-unresolved': 'off',
    'import/order': ['error', { groups: ['builtin', 'external'] }],

    // eslint-plugin-jest
    'jest/no-disabled-tests': 'error',
    'jest/expect-expect': 'off', // Does not work with Cypress

    // eslint-plugin-eslint-comments
    'eslint-comments/no-unused-disable': 'error',

    // @typescript-eslint
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/require-array-sort-compare': [
      'error',
      { ignoreStringArrays: true },
    ],
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/triple-slash-reference': 'off', // Cypress requires triple slash reference
    '@typescript-eslint/strict-boolean-expressions': 'off', // Forces unwanted code style
    '@typescript-eslint/restrict-template-expressions': 'off', // Requires typing catch(e) every time
    '@typescript-eslint/restrict-plus-operands': 'off', // Doesn't support dynamic object occurance counting

    // eslint-plugin-ban
    'ban/ban': [
      'error',
      { name: 'useDispatch', message: 'Please use useAppDispatch()' },
      { name: 'useSelector', message: 'Please use useAppSelector()' },
    ],

    // eslint-plugin-unicorn
    'unicorn/no-useless-undefined': ['error', { checkArguments: true }],

    // TODO: Enable these rules
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/unbound-method': 'off',
  },
};
