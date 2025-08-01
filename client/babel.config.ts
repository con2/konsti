// @ts-expect-error -- Importing types doesn't work with commonjs
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const babelConfig = (api) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  api.cache.using(() => process.env.NODE_ENV);

  const presets = [
    "@babel/typescript",
    [
      "@babel/preset-env",
      {
        useBuiltIns: "entry",
        corejs: "3",
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ];

  const plugins = [
    [
      "babel-plugin-module-resolver",
      {
        root: ["."],
        alias: {
          client: "./src",
          assets: "./assets",
          shared: "../shared/",
        },
        extensions: [".js", ".cjs,", ".ts", ".mts", ".tsx"],
      },
    ],
    "babel-plugin-styled-components",
  ];

  const target = process.env.npm_lifecycle_event;
  if (target === "start") {
    plugins.push(["react-refresh/babel"]);
  }

  return {
    presets,
    plugins,
  };
};

module.exports = babelConfig;
