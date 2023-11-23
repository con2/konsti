module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);
  const target = process.env.npm_lifecycle_event;

  const presets = ["@babel/typescript"];

  const plugins = ["babel-plugin-lodash"];

  if (target === "start") {
    plugins.push(["react-refresh/babel"]);
  }

  const clientOverrides = {
    test: "./client/",
    presets: [
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
    ],
    plugins: ["babel-plugin-styled-components"],
  };

  const serverOverrides = {
    test: "./server/",
    presets: [
      [
        "@babel/preset-env",
        {
          modules: "commonjs",
          targets: {
            node: "current",
          },
        },
      ],
    ],
    plugins: [
      [
        "babel-plugin-module-resolver",
        {
          root: ["."],
          alias: { server: "./src", shared: "../shared" },
          extensions: [".js", ".cjs", ".ts", ".mts"],
        },
      ],
    ],
  };

  const sharedOverrides = {
    test: "./shared/",
    presets: [
      [
        "@babel/preset-env",
        {
          modules: "commonjs",
          targets: {
            node: "current",
          },
        },
      ],
    ],
    plugins: [
      [
        "babel-plugin-module-resolver",
        {
          root: ["."],
          alias: { shared: "./shared" },
          extensions: [".js", ".cjs", ".ts", ".mts"],
        },
      ],
    ],
  };

  return {
    presets,
    plugins,
    overrides: [clientOverrides, serverOverrides, sharedOverrides],
  };
};
