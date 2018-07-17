import handlebars from 'handlebars';

export default function (content) {
    return handlebars.compile(content);
}