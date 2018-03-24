'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SCHEMA_PATH = exports.PROJECT_PLUGINS_CUSTOM = exports.PROJECT_PLUGINS_OFFICIAL = exports.PROJECT_TEMPLATES_CUSTOM = exports.PROJECT_TEMPLATES_OFFICIAL = exports.PROJECT_PATH = exports.PROJECT_ENV = exports.GORILLAJS_PATH = exports.HOME_USER_PATH_FOR_SCRIPTS = exports.HOME_USER_PATH_FOR_BASH = undefined;

var _yargs = require('yargs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOME_USER_PATH_FOR_BASH = exports.HOME_USER_PATH_FOR_BASH = process.env.APPDATA || '$HOME';
var HOME_USER_PATH_FOR_SCRIPTS = exports.HOME_USER_PATH_FOR_SCRIPTS = process.env.APPDATA || process.env.HOME;
var GORILLAJS_PATH = exports.GORILLAJS_PATH = _path2.default.resolve(__dirname);
var PROJECT_ENV = exports.PROJECT_ENV = _yargs.argv.env ? _yargs.argv.env : 'local';
var PROJECT_PATH = exports.PROJECT_PATH = _yargs.argv.path ? _path2.default.resolve(_yargs.argv.path) : process.cwd();
var PROJECT_TEMPLATES_OFFICIAL = exports.PROJECT_TEMPLATES_OFFICIAL = _path2.default.join(GORILLAJS_PATH, 'templates');
var PROJECT_TEMPLATES_CUSTOM = exports.PROJECT_TEMPLATES_CUSTOM = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'templates');
var PROJECT_PLUGINS_OFFICIAL = exports.PROJECT_PLUGINS_OFFICIAL = _path2.default.join(GORILLAJS_PATH, 'plugins');
var PROJECT_PLUGINS_CUSTOM = exports.PROJECT_PLUGINS_CUSTOM = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'plugins');
var SCHEMA_PATH = exports.SCHEMA_PATH = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'schema.json');