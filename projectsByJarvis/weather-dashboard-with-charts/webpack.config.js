// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production', // Or 'development' for development mode
  entry: './src/index.js', // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output filename
    clean: true, // Clean the output directory before each build
  },
  devtool: 'source-map', // Enable source maps for debugging
  devServer: {
    static: './dist', // Serve files from the 'dist' directory
    hot: true, // Enable hot module replacement for faster development
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Apply this rule to JavaScript files
        exclude: /node_modules/, // Exclude 'node_modules' directory
        use: {
          loader: 'babel-loader', // Use Babel to transpile JavaScript
          options: {
            presets: ['@babel/preset-env'], // Use the '@babel/preset-env' preset
          },
        },
      },
      {
        test: /\.css$/, // Apply this rule to CSS files
        use: [
          MiniCssExtractPlugin.loader, // Extract CSS into separate files
          'css-loader', // Load CSS files
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Apply this rule to image files
        type: 'asset/resource', // Use asset/resource to emit separate files
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i, // Apply this rule to font files
        type: 'asset/resource', // Use asset/resource to emit separate files
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Use this HTML file as a template
      filename: 'index.html', // Output filename for the HTML file
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css', // Output filename for the CSS file
    }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(), // Minimize CSS files
      new TerserPlugin(), // Minimize JavaScript files
    ],
    minimize: true, // Enable minimization
  },
};