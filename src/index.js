/* eslint no-new-func: 'off', no-continue: 'off' */
import * as path from 'path';
import { Readable } from 'stream';
import NodeLRU from 'lru-cache';
import { assign } from 'lodash';
import loader from './lib/loader';
import resolveFileName from './lib/resolveFileName';
import engine from './render-engine';

let cache;
const defaultConf = {
    extentions: ['html', 'hb', 'swig', 'art'],
    cache: true,
    cacheLength: 20 * 1024 * 1024,
    rootPath: __dirname,
    renderEngine: engine,
    renderEngineOpt: {},
    loader,
    resolveFileName,
    dataAdaptor: (data) => {
        if (data instanceof Error) {
            return {
                code: data.status || 1,
                msg: process.env.NODE_ENV !== 'production' ? data.stack : data.message,
            }
        } else if (data.code) {
            return data;
        } else {
            return {
                code: 0,
                data: data,
            };
        }
    },
    endCallBack: 'six.end',
    callback: 'six.register',
};

export default class View {
    context = null;
    conf = {};

    constructor(ctx, conf) {
        this.context = ctx;
        this.conf = assign({}, defaultConf, conf);

        if (this.conf.cache) {
            cache = NodeLRU({
                length: (item) => {
                    return item && item.length || 0;
                },
                max: this.conf.cacheLength
            });
        }
    }

    getUrls(data) {
        let str = '<head><script>window.__SIX_URLS=';
        data = Object.keys(data);
        str += JSON.stringify(data);
        str += '</script>';
        return str;
    }

    getAssign(data) {
        const ctx = this.context;
        return Object.assign({}, ctx.state, data);
    }

    render(fileName, data) {
        const ctx = this.context;
        const fileData = this.getFileData(fileName);
        data = this.getAssign(data);
        ctx.type = 'html';
        ctx.body = fileData.render(data) + '</html>';
    }

    aRender(fileName, data, advancedData) {
        const ctx = this.context;
        const fileData = this.getFileData(fileName);
        data = this.getAssign(data);
        ctx.type = 'html';
        ctx.set('Transfer-Encoding', 'chunked');
        
        const html = fileData.render(data);
        const idx = html.indexOf('<head>');

        const preHead = html.substring(0, idx);
        const nextHead = html.substring(idx + 6);
        const urls = this.getUrls(advancedData);

        const newHtml = `${preHead}${urls}${nextHead}`;
        const buffer = Readable();
        let isEnd = false;
        const keys = Object.keys(advancedData);
        let length = keys.length;
        const fn = function f() { isEnd = true; };
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
        }

        keys.forEach(key => {
            const datap = advancedData[key];
            Promise.resolve(datap).then((res) => {
                pushData(key, res);
            }).catch(e => {
                pushData(key, e);
            });
        });
    }

    dataTojs(key, data) {
        const { callback, dataAdaptor} = this.conf;
        data = dataAdaptor(data);
        return `<script>${callback}("${key}", ${JSON.stringify(data)})</script>`;
    }

    end(buffer) {
        const { endCallBack } = this.conf;

        buffer.push(`<script>${endCallBack}()</script></html>`);
        buffer.push(null);
    }

    getFileData(fileName) {
        const conf = this.conf;
        let data;
        if (cache && (data = cache.get(fileName))) {
           return data;
        }
        const { content, extention }  = this.getFile(fileName);
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
            render: compiled,
        };

        if (cache) {
            cache.set(fileName, res);
        }
        return res;
    }

    getFile(fileName) {
        const conf = this.conf;
        fileName = conf.resolveFileName(fileName, conf);
        return {
            content: conf.loader(fileName),
            extention: path.extname(fileName),
        };
    }
}

export const renderEngine = engine;