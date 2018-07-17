"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = compile;
function compile(content) {
    return () => content;
}