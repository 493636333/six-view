'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderEngine = undefined;

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _stream = require('stream');

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

var _lodash = require('lodash');

var _loader = require('./lib/loader');

var _loader2 = _interopRequireDefault(_loader);

var _resolveFileName = require('./lib/resolveFileName');

var _resolveFileName2 = _interopRequireDefault(_resolveFileName);

var _renderEngine = require('./render-engine');

var _renderEngine2 = _interopRequireDefault(_renderEngine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

let cache; /* eslint no-new-func: 'off', no-continue: 'off' */

const defaultConf = {
    extentions: ['html', 'hb', 'swig', 'art'],
    cache: true,
    cacheLength: 20 * 1024 * 1024,
    cacheAge: 1000 * 60 * 60 * 24 * 300,
    rootPath: __dirname,
    renderEngine: _renderEngine2.default,
    renderEngineOpt: {},
    loader: _loader2.default,
    resolveFileName: _resolveFileName2.default,
    dataAdaptor: data => {
        if (data instanceof Error) {
            return {
                code: data.status || 1,
                msg: process.env.NODE_ENV !== 'production' ? data.stack : data.message
            };
        } else if (data.code) {
            return data;
        } else {
            return {
                code: 0,
                data: data
            };
        }
    },
    endCallBack: 'six.end',
    callback: 'six.register',
    clientPackageUrl: 'http://s3plus.meituan.net/v1/mss_c4375b35f5cb4e678b5b55a48c40cf9d/waimai-sfe-six/index.min.js'
};

class View {

    constructor(ctx, conf) {
        this.context = null;
        this.conf = {};

        this.context = ctx;
        this.conf = (0, _lodash.assign)({}, defaultConf, conf);

        if (!cache && this.conf.cache) {
            cache = (0, _lruCache2.default)({
                length: item => {
                    return item && item.length || 0;
                },
                max: this.conf.cacheLength,
                maxAge: this.conf.cacheAge
            });
        }
    }

    getUrls(data) {
        const {
            clientPackageUrl
        } = this.conf;

        let str = `<head><script src="${clientPackageUrl}"></script><script>window.__SIX_URLS=`;
        data = Object.keys(data);
        str += JSON.stringify(data);
        str += '</script>';
        return str;
    }

    getAssign(data) {
        const ctx = this.context;
        return Object.assign({}, ctx.state, data);
    }

    render(fileName, data, runTimeConf) {
        const ctx = this.context;
        const conf = (0, _lodash.assign)({}, this.conf, runTimeConf);
        const extname = path.extname(fileName);

        if (!conf.cache && extname === '.html') {
            ctx.body = this.getHtmlFileDataWithoutCache(fileName, conf);
        } else {
            const fileData = this.getFileData(fileName, conf);
            data = this.getAssign(data);
            ctx.body = fileData.render(data) + '</html>';
        }
        ctx.type = 'html';
    }

    aRender(fileName, data, advancedData, runTimeConf) {
        const ctx = this.context;
        const conf = (0, _lodash.assign)({}, this.conf, runTimeConf);
        const fileData = this.getFileData(fileName, conf);
        data = this.getAssign(data);
        ctx.type = 'html';
        ctx.set('Transfer-Encoding', 'chunked');

        const html = fileData.render(data);
        const idx = html.indexOf('<head>');

        const preHead = html.substring(0, idx);
        const nextHead = html.substring(idx + 6);
        const urls = this.getUrls(advancedData);

        const newHtml = `${preHead}${urls}${nextHead}`;
        const buffer = (0, _stream.Readable)();
        let isEnd = false;
        const keys = Object.keys(advancedData);
        let length = keys.length;
        const fn = function f() {
            isEnd = true;
        };
        buffer.on('end', fn);
        buffer.on('error', fn);
        buffer.on('close', fn);
        buffer._read = () => {};
        ctx.body = buffer;
        buffer.push(newHtml);

        const pushData = (key, result) => {
            if (isEnd) {
                return;
            }
            length--;
            if (buffer._readableState.ended) {
                isEnd = true;
                return;
            }

            buffer.push(this.dataTojs(key, result));

            if (length <= 0) {
                isEnd = true;
                this.end(buffer);
            }
        };

        keys.forEach(key => {
            const datap = advancedData[key];
            Promise.resolve(datap).then(res => {
                pushData(key, res);
            }).catch(e => {
                pushData(key, e);
            });
        });
    }

    dataTojs(key, data) {
        const { callback, dataAdaptor } = this.conf;
        data = dataAdaptor(data);
        return `<script>${callback}("${key}", ${JSON.stringify(data)})</script>`;
    }

    end(buffer) {
        const { endCallBack } = this.conf;

        buffer.push(`<script>${endCallBack}()</script></html>`);
        buffer.push(null);
    }

    // 1. 没有开启渲染优化 2.纯html，不需要编译
    getHtmlFileDataWithoutCache(fileName, conf) {
        conf.returnStream = true;

        const { content } = this.getFile(fileName, conf);
        return content;
    }

    getFileData(fileName, runTimeConf) {
        const conf = runTimeConf || this.conf;
        let data;

        if (conf.cache && (data = cache.get(fileName))) {
            return data;
        }
        const { content, extention } = this.getFile(fileName);
        const extentionWithoutDot = extention.replace(/^\./, '');
        const renderEngine = conf.renderEngine[extentionWithoutDot];

        if (!renderEngine) {
            throw new Error(`do not have renderEngine:${extentionWithoutDot}`);
        }

        const idx = content.lastIndexOf('</html>');
        let contentWithoutHtml = content;
        if (idx > -1) {
            contentWithoutHtml = content.substring(0, idx);
        }

        const compiled = renderEngine(contentWithoutHtml, conf.renderEngineOpt[extentionWithoutDot]);

        const res = {
            length: content.length,
            render: compiled
        };

        if (conf.cache) {
            cache.set(fileName, res);
        }
        return res;
    }

    getFile(fileName, conf) {
        conf = conf || this.conf;
        fileName = conf.resolveFileName(fileName, conf);
        return {
            content: conf.loader(fileName, conf),
            extention: path.extname(fileName)
        };
    }
}

exports.default = View;
const renderEngine = exports.renderEngine = _renderEngine2.default;