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

const copyFromSourceFiles = [
  "options/options.html",
  "icons/",
  "styles.css"];

const distributeFiles = [
  "options/",
  "api/",
  "content/",
  "background.js",
  "common.js",
  "icons/",
  "styles.css"
];

const distributeGlobs = distributeFiles.map(f => f.endsWith('/') ? f + "*" : f);

// export function to access mode
module.exports = (env, argv) => {
  
  const production = argv.mode === 'production';
  // fm plugin delete files
  const deleteFiles = distributeFiles.reduce((acc, of) => {
    const base = 'dist/' + of;
    return of.endsWith('.js') ? [...acc, base, base + '.map'] : [...acc, base]
  }, []);

  return {
    entry: {
      ...entry('api/translate'), // todo: intergrateinto background
      ...entry('api/store'),
      ...entry('common'),
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
          'process.env.COMPILE_ENV': JSON.stringify('webpack'),
          'process.env.DEBUG': JSON.stringify('true')
      }),
      new CleanPlugin(),
      // copy plugin copies from src to build
      new CopyPlugin([
        ...copy_same_arr.apply(null, copyFromSourceFiles),
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
      // fm plugin manages all dirs. Used here for the build dir.
      new FileManagerPlugin({
        onEnd: [
          {
            // needs to be with globs in 1 source, otherwise folder structure is not retained...
            copy: 
              [{
                source: 'dist/{' + distributeGlobs.join() + '}',
                destination: 'dist/chrome/'
            }, {
                source: 'dist/{' + distributeGlobs.join() + '}',
                destination: 'dist/firefox/'
            }]
          },
          !production && {
            delete: deleteFiles
          },
          production && {
            delete: [
              'dist/**/*.js.map',
              ...deleteFiles
            ],
            archive: [
              {
                source: 'dist/chrome',
                destination: `dist/voc-enhancer-chrome-${pkg.version}.zip`
              },
              {
                source: 'dist/firefox',
                destination: `dist/voc-enhancer-firefox-${pkg.version}.zip`
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
  }
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

function copy_same_arr() {
  return [].concat.apply([], Array.from(arguments).map(a => copy_same(a)));
}

// ff_chr copy under same name
function copy_same(i) {
  return copy_FF_CHR({
    from: i,
    to: i
  });
}

// copy to both chrome & firefox
function copy_FF_CHR (o) {
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
      manifest["options_ui"]["chrome_style"] = true;
    } else if (browser === 'firefox') {
      manifest["browser_specific_settings"] = {
          "gecko": {
              "id": "vocenhancer@extension.org",
              "strict_min_version": "42.0"
          }
      };
      manifest["options_ui"]["browser_style"] = true;
    }

    manifest.version = pkg.version;

    return Buffer.from(JSON.stringify(manifest, undefined, 2));
  };
}

