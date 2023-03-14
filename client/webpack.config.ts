import path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import Dotenv from "dotenv-webpack";
import { Configuration } from "webpack";
import "webpack-dev-server";
import { merge } from "webpack-merge";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { config } from "./src/config";
/* eslint-disable-next-line no-restricted-imports */
import { sharedConfig } from "../shared/config/sharedConfig";

const TARGET = process.env.npm_lifecycle_event;

const getEnvVariableFile = (): string | undefined => {
  switch (TARGET) {
    case "build:prod":
      return "./config/prod.env";
    case "build:staging":
      return "./config/staging.env";
    case "build:ci":
      return "./config/ci.env";
    default:
      return "./config/dev.env";
  }
};

require("dotenv").config({ path: getEnvVariableFile() });

const commonConfig: Configuration = {
  // Entry file
  entry: path.join(__dirname, "src", "index"),

  // Output for compiled file
  output: {
    path: path.join(__dirname, "build"),
    publicPath: "/",
    filename: "[name].[contenthash].bundle.js",
  },

  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    fallback: { crypto: false },
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: sharedConfig.appName,
      favicon: path.resolve(__dirname, "assets", "favicon.png"),
      template: path.resolve(__dirname, "src", "index.html"),
    }),
  ],

  module: {
    // Loaders to transform sources
    rules: [
      {
        test: /\.(ts|tsx|js)$/,
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "../shared"),
        ],
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "images",
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
      {
        test: /\.md$/,
        // TODO: Replace with Asset Module: https://webpack.js.org/guides/asset-modules/
        use: "raw-loader",
      },
    ],
  },
};

const devConfig: Configuration = {
  target: "web",

  mode: "development",

  devtool: config.enableReduxTrace ? "source-map" : "eval-source-map",

  // webpack-dev-server config
  devServer: {
    host: "localhost",
    port: 8000,
    hot: true,
    historyApiFallback: true, // respond to 404s with index.html
  },

  plugins: [
    new Dotenv({ path: "./config/dev.env" }),
    new ReactRefreshWebpackPlugin(),
  ],
};

const prodConfig: Configuration = {
  target: "browserslist",

  mode: "production",
  devtool: "source-map",

  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000,
  },

  plugins: [
    new Dotenv({ path: getEnvVariableFile() }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],

  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          name: "vendors",
        },
      },
    },
  },
};

const getWebpackConfig = (): Configuration | undefined => {
  switch (TARGET) {
    case "build:prod":
      return merge(commonConfig, prodConfig);
    case "build:staging":
      return merge(commonConfig, prodConfig);
    case "build:dev":
      return merge(commonConfig, prodConfig);
    case "build:ci":
      return merge(commonConfig, prodConfig);
    case "bundle-analyzer":
      return merge(commonConfig, prodConfig);
    case "start":
      return merge(commonConfig, devConfig);
  }
};

const webpackConfig = getWebpackConfig();

/* eslint-disable-next-line import/no-unused-modules */
export default webpackConfig;