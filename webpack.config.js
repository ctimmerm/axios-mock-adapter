var webpack = require('webpack');

var config = {
  output: {
    library: 'AxiosMockAdapter',
    libraryTarget: 'umd'
  },
  plugins: []
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}

module.exports = config;
