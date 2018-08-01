'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (content, options) {
    return _handlebars2.default.compile(content, options);
};

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }