import Koa from 'koa';
import View from '../index';

var app = new Koa();

app.use((ctx, next) => {
    var view = new View(ctx, {
        rootPath: __dirname + '/view',
    });

    ctx.render = view.render.bind(view);
    ctx.aRender = view.aRender.bind(view);

    return next();
});

function getPromise(data, timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(data);
        }, timeout);
    })
}

app.use((ctx, next) => {
    if (ctx.path == '/haha') {
        ctx.render('index', {name: 'haha'});
    } else if (ctx.path == '/xixi') {
        ctx.aRender('test', {name: 'haha'}, {
            '/a': getPromise('a', 1000),
            '/b': getPromise('b', 2000),
        });
    } else if (ctx.path == '/a') {
        ctx.render('a.html', null, {cache: false});
    }
});

app.listen(3000);