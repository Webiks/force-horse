const path = require('path');

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
      stats: 'errors-only'
    },

    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },

    coverageIstanbulReporter: {
      reports: ['html', 'lcovonly', 'text-summary'],

      // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
      dir: path.join(__dirname, 'coverage'),

      // if using webpack and pre-loaders, work around webpack breaking the source path
      fixWebpackSourcePaths: true,

      'report-config': {

        // all options available at: https://github.com/istanbuljs/istanbul-reports/blob/590e6b0089f67b723a1fdf57bc7ccc080ff189d7/lib/html/index.js#L135-L137
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }

      }
    },

    reporters: config.coverage ? ['kjhtml', 'dots', 'coverage-istanbul'] : ['kjhtml', 'dots'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};