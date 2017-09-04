const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractSASS = new ExtractTextPlugin({filename: 'style.bundle.css'});

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: {
    main: [
      './src/index.js',
      './src/index.scss'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      // Our Javascript (bundle into one)
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
        include: [
          path.join(__dirname, 'src')
        ]
      },
      // Sass
      {
        test: /\.scss$/,
        use: extractSASS.extract({ // Instance 2
          use: [
            'css-loader',
            'sass-loader',
            'postcss-loader'
          ]
        })
      },
      // Images
      {
        test: /\.(jpe?g|png|gif|svg|ico)/,
        loader: require.resolve('url-loader'),
        query: {
          limit: 1000,
          name: '[name].[ext]'
        }
      }
    ]
  },
  plugins: [
    extractSASS
  ],
  target: 'node'
};