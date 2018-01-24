const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: 'src/views/public/index.html',
  filename: 'index.html',
  inject: 'body'
})

const BUILD_DIR = path.resolve(__dirname, 'src/views/public/')
const APP_DIR = path.resolve(__dirname, 'src/views/')


module.exports = {
  entry: APP_DIR + '/index.js',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015','react']
        },
        exclude: /node_modules/
      },
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015','react']
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loaders: ['style-loader','css-loader'],
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [HtmlWebpackPluginConfig]
}
