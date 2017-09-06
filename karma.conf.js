module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],

    files: [
      {pattern: 'src/**/*.spec.js', watched: true}
    ],

    preprocessors: {
      // add webpack as preprocessor
      'src/**/*.spec.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',

      resolve: {
        extensions: ['.js']
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
          }, {
            test: /\.html$/,
            loader: 'null-loader'
          }, {
            test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
            loader: 'null-loader'
          }
        ]
      }
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};