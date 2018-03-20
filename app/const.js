'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PROJECT_PATH = undefined;

var _yargs = require('yargs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PROJECT_PATH = exports.PROJECT_PATH = _yargs.argv._[0] === 'build' && _yargs.argv._[1] ? _path2.default.resolve(_yargs.argv._[1]) : process.cwd();

console.log(_path2.default.resolve('~/'));