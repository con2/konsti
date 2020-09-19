module.exports = (api) => {
  api.cache(true);

  const target = process.env.npm_lifecycle_event;

  const presets = [
    [
      '@babel/preset-env',
      {
        debug: false,
        useBuiltIns: 'entry',
        corejs: '3',
      },
    ],
    '@babel/preset-react',
    '@babel/typescript',
  ];

  const plugins = [
    [
      'babel-plugin-module-resolver',
      {
        root: ['./src'],
        alias: { assets: './assets' },
        extensions: ['.js', '.ts', '.tsx'],
      },
    ],
    'babel-plugin-lodash',
    'babel-plugin-styled-components',
  ];

  if (target === 'start') {
    plugins.push(['react-hot-loader/babel']);
  }

  return {
    presets,
    plugins,
  };
};
