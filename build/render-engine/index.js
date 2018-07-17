'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _art = require('./art');

var _art2 = _interopRequireDefault(_art);

var _handlebars = require('./handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

var _swig = require('./swig');

var _swig2 = _interopRequireDefault(_swig);

var _html = require('./html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
    art: _art2.default,
    hb: _handlebars2.default,
    swig: _swig2.default,
    html: _html2.default
};