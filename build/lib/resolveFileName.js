'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (filename, options) {
    const path = require('path');
    const root = options.rootPath;
    const extentions = options.extentions;
    const loader = options.loader;

    if (LOCAL_MODULE.test(filename)) {
        const from = options.filename;
        const self = !from || filename === from;
        const base = self ? root : path.dirname(from);
        filename = path.resolve(base, filename);
    } else {
        filename = path.resolve(root, filename);
    }

    if (!path.extname(filename)) {
        const extention = extentions.find(ext => {
            const tempFileName = `${filename}.${ext}`;
            if (loader(tempFileName) !== false) {
                return true;
            }
            return false;
        });

        if (extention) {
            filename = `${filename}.${extention}`;
        } else {
            throw new Error(`do not have view: ${filename}`);
        }
    }

    return filename;
};

const LOCAL_MODULE = /^\.+\//;

/**
 * 获取模板的绝对路径
 * @param   {string} filename 
 * @param   {Object} options 
 * @return  {string}
 */
;