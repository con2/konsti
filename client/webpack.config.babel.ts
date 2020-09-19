import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import BrotliPlugin from 'brotli-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import { config } from './src/config';

const stats = {
  // assets: false,
  // children: false,
  // chunks: false,
  // hash: false,
  modules: false,
  // publicPath: false,
  // timings: false,
  // version: false,
  // warnings: true,
};

const commonConfig = {
  target: 'web' as const,

  // Array of entry files
  entry: {
    client: [path.join(__dirname, 'src', 'index')],
  },

  // Output for compiled file
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    filename: '[name].[hash].bundle.js',
  },

  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.ts', '.tsx'],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: config.appName,
      favicon: path.resolve(__dirname, 'assets', 'favicon.png'),
      template: path.resolve(__dirname, 'src', 'index.html'),
    }),
    new webpack.HashedModuleIdsPlugin(), // so that file hashes don't change unexpectedly
  ],

  module: {
    // Loaders to transform sources
    rules: [
      {
        // JS/TS loaders
        test: /\.(ts|tsx|js)$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
    ],
  },
};

const devConfig: Configuration = {
  mode: 'development' as const,

  devtool: config.reduxTrace ? ('source-map' as const) : ('eval' as const), // Use eval for best hot-loading perf

  // webpack-dev-server config
  devServer: {
    host: 'localhost',
    port: 8000,
    hot: true, // enable HMR on the server
    contentBase: path.join(__dirname, 'build'),
    historyApiFallback: true, // respond to 404s with index.html
    stats,
  },

  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(), // Enable HMR globally
  ],
};

const prodConfig: Configuration = {
  mode: 'production' as const,

  stats,

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'assets' }],
    }),
    new MomentLocalesPlugin({
      localesToKeep: ['fi'], // “en” is built into Moment and can’t be removed
    }),
    new Dotenv({
      path: './.prod.env',
    }),
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new BrotliPlugin({
      asset: '[path].br[query]',
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],

  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
        },
      }),
    ],
    // https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
    runtimeChunk: 'single' as const,
    splitChunks: {
      chunks: 'all' as const,
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];

            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
};

const stagingConfig: Configuration = {
  mode: 'production' as const,

  stats,

  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'assets' }],
    }),
    new MomentLocalesPlugin({
      localesToKeep: ['fi'], // “en” is built into Moment and can’t be removed
    }),
    new Dotenv({
      path: './.staging.env',
    }),
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new BrotliPlugin({
      asset: '[path].br[query]',
      test: /\.(js|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],

  optimization: {
    minimize: false,
    namedModules: true,
    namedChunks: true,
    moduleIds: 'named' as const,
    chunkIds: 'named' as const,
    // https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
    runtimeChunk: 'single' as const,
    splitChunks: {
      chunks: 'all' as const,
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];

            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
};

const getWebpackConfig = (): Configuration => {
  const TARGET = process.env.npm_lifecycle_event;

  switch (TARGET) {
    case 'build:prod' || 'bundle-analyzer':
      return merge(commonConfig, prodConfig);
    case 'build:staging':
      return merge(commonConfig, stagingConfig);
    default:
      return merge(commonConfig, devConfig);
  }
};

const webpackConfig = getWebpackConfig();

/* eslint-disable-next-line import/no-unused-modules */
export default webpackConfig;
