const fs = require('fs');
const path = require('path');
const process = require('./process');

const DEFAULT_STATS_FILE = './better-stats.json';

class BetterStatsWebpackPlugin {
    constructor(options = {}) {
        this.statsFile = path.resolve(process.cwd(), options.statsFile || DEFAULT_STATS_FILE);
        this.writeStats = this.writeStats.bind(this);
    }
    apply(compiler) {
        compiler.plugin('after-emit', this.writeStats);
    }
    writeStats(compilation, done) {
        const { modules, assetsByChunkName: abcn, publicPath } = compilation.getStats().toJson();
        const stats = {
            assets: {}
        };
        Object.keys(abcn).forEach(name => {
            const files = Array.isArray(abcn[name]) ? abcn[name] : [abcn[name]];
            stats[`${name}_js`] = [];
            stats[`${name}_js_import`] = '';
            stats[`${name}_css`] = [];
            stats[`${name}_css_import`] = '';

            files.forEach(file => {
                const url = publicPath + file;
                const ext = path.extname(file).replace(/^./, '');
                if (ext === 'js') {
                    stats[`${name}_js`].push(url);
                    stats[`${name}_js_import`] += `<script src="${url}"></script>`;
                }
                else if (ext === 'css') {
                    stats[`${name}_css`].push(url);
                    stats[`${name}_css_import`] += `<link rel="stylesheet" href="${url}"/>`;
                }
            });
        });

        modules
            .filter(m => m.assets.length === 1)
            .forEach(m => {
                if (m.assets.length === 1) {
                    const key = path.relative(compilation.options.context, m.name);
                    stats.assets[key] = publicPath + m.assets[0];
                }
            });

        fs.writeFile(this.statsFile, JSON.stringify(stats, null, '  '), done);
    }
}

module.exports = BetterStatsWebpackPlugin;
