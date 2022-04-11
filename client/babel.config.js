// This separate config is required because of a bug in babel-plugin-module-resolver: https://github.com/tleunen/babel-plugin-module-resolver/issues/338
module.exports = {
  extends: "../babel.config.js",
  plugins: [
    [
      "babel-plugin-module-resolver",
      {
        root: ["."],
        alias: {
          client: "./src",
          assets: "./assets",
          shared: "../shared/",
          playwright: "./playwright",
        },
        extensions: [".js", ".ts", ".tsx"],
      },
    ],
  ],
};
