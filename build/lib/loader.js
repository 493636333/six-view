'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = loader;
const fs = require('fs');
function loader(filename, conf) {
    if (!fs.existsSync(filename)) {
        return false;
    }

    if (conf && conf.returnStream) {
        return fs.createReadStream(filename);
    }
    return fs.readFileSync(filename, 'utf8');
};