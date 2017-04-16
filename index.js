/*!
 Copyright 2015 Dmitriy Kubyshkin

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

var walk = require('acorn/dist/walk');
var loaderUtils = require('loader-utils');
var ConcatSource = require('webpack-sources').ConcatSource;
var DynamicTranslationKeyError = require('./DynamicTranslationKeyError');
var NoTranslationKeyError = require('./NoTranslationKeyError');
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');
var NullFactory = require('webpack/lib/NullFactory');
var KeyGenerator = require('./key-generator');

/**
 * @param {Object} options
 * @constructor
 */
function ExtractTranslationPlugin(options) {
    options = options || {};
    this.functionName = options.functionName || '__';
    this.done = options.done || function () {};
    this.output = typeof options.output === 'string' ? options.output : false;
    this.mangleKeys = options.mangle || false;
}

ExtractTranslationPlugin.prototype.apply = function(compiler) {
    const keys = {};
    const functionName = this.functionName;
    //var generator = KeyGenerator.create();

    compiler.plugin('compilation', (compilation, params) => {
        compilation.plugin('build-module', (module) => {
            module.parser.plugin('program', (ast) => {
                walk.simple(ast, {
                    CallExpression(node) {
                        if (node.callee.name !== functionName) {
                            return false;
                        }

                        if (!node.arguments.length) {
                            module.errors.push(new NoTranslationKeyError(module, node));
                            return false;
                        }

                        const key = node.arguments[0].value;

                        if (typeof key !== 'string') {
                            module.errors.push(new DynamicTranslationKeyError(module, node));
                            return false;
                        }

                        if (!(key in keys)) {
                            keys[key] = key;
                        }

                        return false;
                    }
                });
            });
        });

        //compilation.dependencyFactories.set(ConstDependency, new NullFactory());
        //compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
    });

    compiler.plugin('emit', (compilation, callback) => {
        if (this.output) {
            var source = new ConcatSource(JSON.stringify(keys));
            compilation.assets[compilation.getPath(this.output)] = source;
        }
        callback();
    });

    compiler.plugin('done', () => {
        console.log(keys);
        this.done(keys);
    });
};

module.exports = ExtractTranslationPlugin;
