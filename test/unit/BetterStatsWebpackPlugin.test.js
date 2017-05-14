const { expect, assert } = require('chai');
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire');

describe('BetterStatsWebpackPlugin', () => {
    const CWD = '/test/land';
    let BetterStats;
    let mocks;
    let rawStats;

    beforeEach(() => {
        rawStats = {
            assetsByChunkName: {},
            modules: [],
            publicPath: '/test/public/path/',
        };
        mocks = {
            fs: { writeFile: sinon.stub() },
            process: { cwd: sinon.stub().returns(CWD) }
        };
        BetterStats = proxyquire('../../lib/BetterStatsWebpackPlugin', {
            'fs': mocks.fs,
            './process': mocks.process,
        });
    });

    describe('options: statsFile', () => {
        it('saves statsFile defaults to $CWD/better-stats.json', () => {
            const wbs = new BetterStats();
            const expectedPath = path.resolve(CWD, 'better-stats.json');
            expect(wbs.statsFile).to.equal(expectedPath);
        });

        it('sets expected statsFile when option is defined as relative path', () => {
            const wbs = new BetterStats({ statsFile: 'lol.json' });
            const expectedPath = path.resolve(CWD, 'lol.json');
            expect(wbs.statsFile).to.equal(expectedPath);
        });

        it('sets expected statsFile when option is defined as absolute path', () => {
            const wbs = new BetterStats({ statsFile: '/test/other/land.json' });
            const expectedPath = '/test/other/land.json';
            expect(wbs.statsFile).to.equal(expectedPath);
        });
    });

    describe('transform stats', () => {
        const getStats = (rawStatsJson) => {
            const rawStats = { toJson: sinon.stub().returns(rawStatsJson) };
            const compiler = { plugin: sinon.stub() };
            const compilation = {
                options: { context: path.resolve(__dirname, '../../') },
                getStats: sinon.stub().returns(rawStats)
            };
            const wbs = new BetterStats();
            wbs.apply(compiler);
            assert(compiler.plugin.withArgs('after-emit').calledOnce, 'Expect done plugin to be registered');
            compiler.plugin.withArgs('after-emit').lastCall.args[1](compilation);
            assert(mocks.fs.writeFile.calledOnce, 'Expect writeFile called');
            return JSON.parse(mocks.fs.writeFile.lastCall.args[1]);
        };

        it('can handle single file chunks', () => {
            rawStats.assetsByChunkName.main = 'file1.js';
            const stats = getStats(rawStats);
            expect(stats.main_js).to.eql(['/test/public/path/file1.js']);
        });

        it('can handle multiple file chunks', () => {
            rawStats.assetsByChunkName.main = ['file1.js', 'file2.css'];
            const stats = getStats(rawStats);
            expect(stats.main_js).to.eql(['/test/public/path/file1.js']);
            expect(stats.main_css).to.eql(['/test/public/path/file2.css']);
        });

        it('exports <name>[_js,_js_import_html,_css,_css_import_html] for empty chunks', () => {
            rawStats.assetsByChunkName.main = [];
            rawStats.assetsByChunkName.admin = [];
            const stats = getStats(rawStats);

            ['main', 'admin'].forEach((name) => {
                expect(stats).to.have.property(`${name}_js`).that.eql([]);
                expect(stats).to.have.property(`${name}_js_import`).that.eql('');
                expect(stats).to.have.property(`${name}_css`).that.eql([]);
                expect(stats).to.have.property(`${name}_css_import`).that.eql('');
            });
        });

        it('prefixes filenames with publicPath', () => {
            rawStats.assetsByChunkName.main = ['file1.js'];
            const stats = getStats(rawStats);
            expect(stats.main_js).to.eql(['/test/public/path/file1.js']);
        });

        it('places assets in <src-path>: <dist-path> array', () => {
            rawStats.modules = [{
                name: path.resolve(__dirname, '../../', 'src/cat.gif'),
                assets: ['2436h298h46h.gif']
            }, {
                name: path.resolve(__dirname, '../../', 'src/hd-pic.jpg'),
                assets: ['erjgbiergeobu.jpg']
            }];
            const stats = getStats(rawStats);
            sinon.assert.match(stats.assets, {
                'src/cat.gif': '/test/public/path/2436h298h46h.gif',
                'src/hd-pic.jpg': '/test/public/path/erjgbiergeobu.jpg'
            });
        });

        it('formats <chunk-name>_js_import as expected', () => {
            rawStats.assetsByChunkName.main = ['file1.js', 'file2.css'];
            const stats = getStats(rawStats);
            expect(stats.main_js_import).to.eql('<script src="/test/public/path/file1.js"></script>');
        });

        it('formats <chunk-name>_css_import as expected', () => {
            rawStats.assetsByChunkName.main = ['file1.js', 'file2.css', 'file3.css'];
            const stats = getStats(rawStats);
            expect(stats.main_css_import).to.eql(
                '<link rel="stylesheet" href="/test/public/path/file2.css"/>' +
                '<link rel="stylesheet" href="/test/public/path/file3.css"/>'
            );
        });
    });
});
