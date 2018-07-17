import swig from 'swig';

export default function (content) {
    return swig.compile(content);
}
