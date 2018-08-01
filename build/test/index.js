'use strict';

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = new _koa2.default();

app.use((ctx, next) => {
    var view = new _index2.default(ctx, {
        rootPath: __dirname + '/view'
    });

    ctx.render = view.render.bind(view);
    ctx.aRender = view.aRender.bind(view);

    return next();
});

function getPromise(data, timeout) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, timeout);
    });
}

app.use((ctx, next) => {
    if (ctx.path == '/haha') {
        ctx.render('index', { name: 'haha' });
    } else if (ctx.path == '/xixi') {
        ctx.aRender('test', { name: 'haha' }, {
            '/a': getPromise('a', 1000),
            '/b': getPromise('b', 2000)
        });
    } else if (ctx.path == '/a') {
        ctx.render('a.html', null, { cache: false });
    }
});

app.listen(3000);