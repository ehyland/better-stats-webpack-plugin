// const { expect, assert } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const BetterStats = require('../../lib/BetterStatsWebpackPlugin');

const TEST_APP_PATH = path.resolve(__dirname, './resources/test-app');
const WORKSPACES = path.resolve(__dirname, `./workspace_${Date.now()}`);

describe('built stats', () => {
    let count = 0;
    let workspace;
    let statsFile;
    let webpackOptions;

    beforeEach(() => {
        workspace = path.resolve(WORKSPACES, `test-app_${++count}`);
        statsFile = path.resolve(workspace, 'better-stats.json');

        webpackOptions = {
            context: workspace,
            entry: './src/app.js',
            output: {
                filename: '[name].js',
                path: path.resolve(workspace, 'dist'),
                publicPath: 'https://s3.eamon.sh/my-app/'
            },
            module: {
                rules: [
                    {
                        test: /\.css$/,
                        use: ExtractTextWebpackPlugin.extract(['css-loader'])
                    },
                    {
                        test: /\.gif$/,
                        use: 'file-loader'
                    }
                ]
            },
            plugins: [
                new ExtractTextWebpackPlugin('[name].css'),
                new BetterStats({ statsFile })
            ]
        };

        return fs.copy(TEST_APP_PATH, workspace);
    });

    after(() =>
        fs.remove(WORKSPACES)
    );

    const runBuild = () => new Promise(resolve =>
        webpack(webpackOptions).run(resolve)
    );

    const readStats = () => fs.readJson(statsFile);

    describe('writes expected stats to file when passed', () => {
        it('single unnamed chunk & entrypoint', () => {
            webpackOptions.entry = './src/app.js';
            return runBuild().then(readStats).then(stats => {
                sinon.assert.match(stats, {
                    main_js: ['https://s3.eamon.sh/my-app/main.js'],
                    main_js_import: '<script src="https://s3.eamon.sh/my-app/main.js"></script>',
                    main_css: [],
                    main_css_import: '',
                });
            });
        });

        it('single unnamed chunk with multiple entrypoints', () => {
            webpackOptions.entry = ['./src/app.js', './src/admin.js'];
            return runBuild().then(readStats).then(stats => {
                sinon.assert.match(stats, {
                    main_js: ['https://s3.eamon.sh/my-app/main.js'],
                    main_js_import: '<script src="https://s3.eamon.sh/my-app/main.js"></script>',
                    main_css: [],
                    main_css_import: '',
                });
            });
        });

        it('multiple chunks', () => {
            webpackOptions.entry = {
                app: ['./src/app.js'],
                admin: './src/admin.js'
            };
            return runBuild().then(readStats).then(stats => {
                sinon.assert.match(stats, {
                    app_js: ['https://s3.eamon.sh/my-app/app.js'],
                    app_js_import: '<script src="https://s3.eamon.sh/my-app/app.js"></script>',
                    app_css: [],
                    app_css_import: '',
                    admin_js: ['https://s3.eamon.sh/my-app/admin.js'],
                    admin_js_import: '<script src="https://s3.eamon.sh/my-app/admin.js"></script>',
                    admin_css: [],
                    admin_css_import: '',
                });
            });
        });

        it('css assets', () => {
            webpackOptions.entry = { sidebar: './src/sidebar.js' };
            return runBuild().then(readStats).then(stats => {
                sinon.assert.match(stats, {
                    sidebar_js: ['https://s3.eamon.sh/my-app/sidebar.js'],
                    sidebar_js_import: '<script src="https://s3.eamon.sh/my-app/sidebar.js"></script>',
                    sidebar_css: ['https://s3.eamon.sh/my-app/sidebar.css'],
                    sidebar_css_import: '<link rel="stylesheet" href="https://s3.eamon.sh/my-app/sidebar.css"/>'
                });
            });
        });
        it('img assets', () => {
            webpackOptions.entry = { sidebar: './src/sidebar.js' };
            return runBuild().then(readStats).then(stats => {
                sinon.assert.match(stats.assets, {
                    'src/one-pixel.gif': 'https://s3.eamon.sh/my-app/df16d33739defe9bda1f4c45d36fd7a7.gif'
                });
            });
        });
    });
});
