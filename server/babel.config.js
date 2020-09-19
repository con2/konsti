module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);
  const presets = [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        debug: false,
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/typescript',
  ];

  const plugins = [
    [
      'babel-plugin-module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.ts'],
      },
      'babel-plugin-lodash',
    ],
  ];

  return {
    presets,
    plugins,
  };
};
