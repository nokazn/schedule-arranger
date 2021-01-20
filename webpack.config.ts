import path from 'path';
import type { Configuration } from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin';

const extensions = ['.ts', 'tsx', 'js', 'jsx'];

const config: Configuration = {
  context: path.join(__dirname),
  mode: 'none',
  entry: path.join(__dirname, '/app/entry'),
  output: {
    path: path.join(__dirname, '/src/public/js'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },

  resolve: {
    extensions,
  },

  plugins: [
    new ESLintPlugin({
      extensions,
    }),
    new ForkTsCheckerPlugin(),
  ],
};

export default config;
