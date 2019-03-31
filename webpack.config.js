// many functions and ways of thinking taken from the toggl-button extension 
const path = require('path');
const pkg = require('./package.json');

const fs = require('fs');
const webpack = require('webpack');
const CleanPlugin = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
// const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins');
// const { EnvironmentPlugin } = require('webpack');
// const log = require('webpack-log')({ name: 'wds' });
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const production = false;

module.exports = {
  entry: {
    ...entry('api/translate'), // todo: intergrateinto background
    ...entry('common'),
    ...entry('settings'),
    ...entry('background'),
    ...entry('options/options'),
    ...entryContentScripts()
  },
  target: 'web',
  context: path.resolve(__dirname, 'src'),
  devtool: 'source-map',
  output: {
    //filename: 'vocabulary-api.js',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
      aliasFields: ['browser'],
  },
  node: {
    "voc-dom": "empty",
    "voc-http": false
  },
  module: {
    // rules: [
    //   {
    //     test: /\.js$/,
    //     exclude: /node_modules/,
    //     use: 'babel-loader'
    //   }
    // ]
  },
  plugins: [
    new webpack.DefinePlugin({
        'process.env.COMPILE_ENV': JSON.stringify('webpack')
    }),
    new CleanPlugin(),
    new CopyPlugin([
      // ...copy({
      //   from: 'html/',
      //   to: 'html/'
      // }),
      ...copy({
        from: 'icons/',
        to: 'icons/'
      }),
      ...copy({
        from: 'styles.css',
        to: 'styles.css'
      }),
      ...copy({
        from: 'options/options.html',
        to: 'options/options.html'
      }),
      {
        from: 'manifest.json',
        to: 'chrome/manifest.json',
        transform: transformManifest('chrome')
      },
      {
        from: 'manifest.json',
        to: 'firefox/manifest.json',
        transform: transformManifest('firefox')
      }
    ]),
    new FileManagerPlugin({
      onEnd: [
        {
          copy: [
            { source: 'dist/**/{*.js,*.js.map}', destination: 'dist/chrome/' },
            { source: 'dist/**/{*.js,*.js.map}', destination: 'dist/firefox/' }
          ]
        },
        production && {
          delete: [
            'dist/**/*.js.map'
          ],
          archive: [
            {
              source: 'dist/chrome',
              destination: `dist/toggl-button-chrome-${version}.zip`
            },
            {
              source: 'dist/firefox',
              destination: `dist/toggl-button-firefox-${version}.zip`
            }
          ]
        }
      ]
    })//,
    // new ChromeExtensionReloader({
    //   entries: { 
    //     contentScript: ['common', 'api/translate', ...entryContentNames()],
    //     background: 'background'
    //   }
    // })
]
};

/** read titles of content file scripts
 * @returns an object in the form {"content/scriptname": "./content/scriptname.js"}
 * with all scripts from the ./src/content dir
*/
function entryContentScripts () {
  const contentScriptFiles = fs.readdirSync('./src/content/');
  return contentScriptFiles.reduce((entries, file) => {
    const name = file.replace('.js', '');
    return Object.assign(entries, entry(`content/${name}`));
  }, {});
}

function entryContentNames () {
  const contentScriptFiles = fs.readdirSync('./src/content/');
  return contentScriptFiles.map((file) => `content/${file.replace('.js', '')}`);
}

function entry (name) {
  return {
    [`${name}`]: `./${name}.js`
  };
}

function copy (o) {
  return [
    {
      ...o,
      to: `chrome/${o.to}`
    },
    {
      ...o,
      to: `firefox/${o.to}`
    }
  ];
}

function transformManifest (browser) {
  return function (content) {
    const manifest = JSON.parse(content.toString());

    if (browser === 'chrome') {
      manifest["background"]["persistent"] = true;
    }

    manifest.version = pkg.version;

    return Buffer.from(JSON.stringify(manifest, undefined, 2));
  };
}

