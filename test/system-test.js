'use strict';

const webpack = require('webpack');
const Plugin = require('../index.js');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

function smokeTests(body, extraPlugins) {
    body();

    afterEach(() => {
        if (fs.existsSync('test/output.js')) {
            fs.unlinkSync('test/output.js');
        }

        if (fs.existsSync('test/translation-keys.json')) {
            fs.unlinkSync('test/translation-keys.json');
        }
    });

    describe('when valid input and output file given', function() {
        it('extracts the keys used in input file', done => {
            const webpackConfig = {
                entry: './test/test-data.js',
                output: {
                    filename: 'output.js',
                    path: './test/'
                },
                plugins: [
                    new Plugin({
                        output: 'translation-keys.json'
                    }),
                    new webpack.ProvidePlugin({'__': 'tranzlate'})
                ],
                module: {
                    rules: [
                        {
                            test: /.js$/,
                            loader: 'babel-loader',
                            options: {
                                presets: [ 'env' ]
                            }
                        }
                    ]
                }
            };

            webpack(webpackConfig, (error) => {
                assert.equal(error, null);

                const content = fs.readFileSync('test/translation-keys.json').toString();
                assert.equal(content, '{"test.key":"test.key"}');
                done();
            });
        });
    });
}

describe('When using a global constant', () => {
    smokeTests(() => {
        beforeEach(() => {
            fs.writeFileSync('test/test-data.js', 'const a = __(\'test.key\');');
        });

        afterEach(() => {
            fs.unlinkSync('test/test-data.js');
        });
    });
});

describe('When using an imported method', () => {
    smokeTests(() => {
        beforeEach(() => {
            fs.writeFileSync('test/something.js', 'module.exports = function() { }');
            fs.writeFileSync('test/test-data.js', 'const __ = require(\'./something\'); const a = __(\'test.key\');');
        });

        afterEach(() => {
            fs.unlinkSync('test/something.js');
            fs.unlinkSync('test/test-data.js');
        });
    });
});
