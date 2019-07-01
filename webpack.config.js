var config = {
  output: {
    library: 'AxiosMockAdapter',
    libraryTarget: 'umd'
  },
  externals: {
    axios: 'axios'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  plugins: []
};

module.exports = config;
