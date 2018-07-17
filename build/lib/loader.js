'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = loader;
const fs = require('fs');
function loader(filename) {
    if (!fs.existsSync(filename)) {
        return false;
    }
    return fs.readFileSync(filename, 'utf8');
};