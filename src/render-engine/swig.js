import swig from 'swig';

export default function (content, options) {
    return swig.compile(content, options);
}
