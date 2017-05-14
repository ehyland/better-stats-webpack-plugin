<h1 align="center">better-stats-webpack-plugin</h1>

<p align="center">
    Usable stats output for webpack builds.
<p>

<h2 align="center">Install</h2>

```bash
npm install --save-dev better-stats-webpack-plugin
```

<h2 align="center">Usage</h2>

```js
const BetterStatsWebpackPlugin = require("better-stats-webpack-plugin");

module.exports = {
  entry: {
    main: 'src/app.js',
    admin: 'src/admin.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(workspace, 'dist'),
    publicPath: 'https://s3.eamon.sh/my-app/'
  },
  module: {
    rules: [...]
  },
  plugins: [
    new BetterStatsWebpackPlugin({ statsFile: './better-stats.json' }),
  ]
}
```

<h2 align="center">Result</h2>

```js
{
  "[entry]_js": ["[public-file-path].js"],
  "[entry]_js_import": "<script src=\"[public-file-path].js\"></script>",
  "[entry]_css": ["[public-file-path].css"],
  "[entry]_css_import": "<link rel=\"stylesheet\" href=\"[public-file-path].css\"/>",
  
  "assets": [
    "src/cat.gif": "[public-file-path].gif"
  ]
}
```

## Options

### `statsFile`
**Description:** Better stats output path  
**Default:** $PWD/better-stats.json

