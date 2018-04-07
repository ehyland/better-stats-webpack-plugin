// const { expect, assert } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BetterStats = require('../../lib/BetterStatsWebpackPlugin');

const TEST_APP_PATH = path.resolve(__dirname, './resources/test-app');
const WORKSPACE_PREFIX = path.resolve(__dirname, `./test-app_${Date.now()}`);

describe('built stats', () => {
    let count = 0;
    let workspace;
    let statsFile;
    let webpackOptions;

    beforeEach(() => {
        workspace = WORKSPACE_PREFIX + `_${++count}`;
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
                        use: [
                            MiniCssExtractPlugin.loader,
                            'css-loader'
                        ],
                    },
                    {
                        test: /\.gif$/,
                        use: 'file-loader'
                    }
                ]
            },
            plugins: [
                new MiniCssExtractPlugin({ filename: '[name].css' }),
                new BetterStats({ statsFile })
            ]
        };

        return fs.copy(TEST_APP_PATH, workspace);
    });

    afterEach(() =>
        fs.remove(workspace)
    );

    const runBuild = () => new Promise((resolve, reject) => {
        webpack(webpackOptions).run((err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        });
    });

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
