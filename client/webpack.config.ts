import path from "node:path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import Dotenv from "dotenv-webpack";
import { Configuration } from "webpack";
import "webpack-dev-server";
import { merge } from "webpack-merge";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const TARGET = process.env.npm_lifecycle_event;

const getEnvVariableFile = (): string | undefined => {
  switch (TARGET) {
    case "build:prod":
      return "./config/prod.env";
    case "build:staging":
      return "./config/staging.env";
    case "build:ci":
      return "./config/ci.env";
    case "build:kube-dev":
      return "./config/kube-dev.env";
    default:
      return "./config/dev.env";
  }
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
require("dotenv").config({ path: getEnvVariableFile() });

const commonConfig: Configuration = {
  // Entry file
  entry: path.join(__dirname, "src", "index"),

  // Output for compiled file
  output: {
    path: path.join(__dirname, "build"),
    publicPath: "/",
    filename: "[name].[contenthash].bundle.js",
    chunkFilename: "[name].[contenthash].chunk.bundle.js",
  },

  resolve: {
    extensions: [".js", ".cjs", ".ts", ".mts", ".tsx"],
    fallback: { crypto: false },
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Konsti",
      favicon: path.resolve(__dirname, "assets", "favicon.png"),
      template: path.resolve(__dirname, "src", "index.html"),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "assets", "robots.txt"),
          to: "robots.txt",
        },
      ],
    }),
  ],

  module: {
    // Loaders to transform sources
    rules: [
      {
        test: /\.(ts|tsx|js|cjs|mts)$/,
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
        test: /\.mdx?$/,
        use: [
          {
            loader: "@mdx-js/loader",
            /** @type {import('@mdx-js/loader').Options} */
            options: {},
          },
        ],
      },
    ],
  },
};

const devConfig: Configuration = {
  target: "web",

  mode: "development",

  // Set to "source-map" with enableReduxTrace
  devtool: "eval-source-map",

  // webpack-dev-server config
  devServer: {
    host: "127.0.0.1",
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
          test: /[\\/]node_modules[\\/]/,
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
    case "build:kube-dev":
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

// eslint-disable-next-line import/no-unused-modules
export default webpackConfig;
