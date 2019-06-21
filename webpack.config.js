const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

const production = slsw.lib.options.stage === 'prd';

const entries = {};
Object.keys(slsw.lib.entries).forEach(
  key => (entries[key] = ['./source-map-install.js', slsw.lib.entries[key]])
);


module.exports = {
  target: 'async-node',
  entry: entries,
  mode: production ? 'production' : 'development',
  devtool: production ? '' : 'source-map',
  externals: [ nodeExternals() ],
  resolve: {
    extensions: [ '.js', '.jsx', '.json', '.ts', '.tsx' ],
    alias: {
      '~': path.join(__dirname, './src')
    }
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader' }
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  }
};
