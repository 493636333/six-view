'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (content, options) {
    return _artTemplate2.default.compile(content, options);
};

var _artTemplate = require('art-template');

var _artTemplate2 = _interopRequireDefault(_artTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }