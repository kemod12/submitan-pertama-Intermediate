const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
  },
});
