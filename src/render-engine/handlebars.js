import handlebars from 'handlebars';

export default function (content, options) {
    return handlebars.compile(content, options);
}