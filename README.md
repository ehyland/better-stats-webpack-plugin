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
  "main_js": ["https://s3.eamon.sh/my-app/main.js"],
  "main_js_import": "<script src=\"https://s3.eamon.sh/my-app/main.js\"></script>",
  "main_css": ["https://s3.eamon.sh/my-app/main.css"],
  "main_css_import": "<link rel=\"stylesheet\" href=\"https://s3.eamon.sh/my-app/main.css\"/>",
  
  "admin_js": ["https://s3.eamon.sh/my-app/admin.js"],
  "admin_js_import": "<script src=\"https://s3.eamon.sh/my-app/admin.js\"></script>",
  "admin_css": ["https://s3.eamon.sh/my-app/admin.css"],
  "admin_css_import": "<link rel=\"stylesheet\" href=\"https://s3.eamon.sh/my-app/admin.css\"/>",
  
  "assets": [
    "src/cat.gif": "https://s3.eamon.sh/my-app/df16d33739defe9bda1f4c45d36fd7a7.gif"
  ]
}
```

## Options

### `statsFile`
**Description:** Better stats output path  
**Default:** $PWD/better-stats.json

