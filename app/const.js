'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEBUG = exports.SCHEMA_PATH = exports.SYSTEM_HOSTS_FILE = exports.PROJECT_PLUGINS_CUSTOM = exports.PROJECT_PLUGINS_OFFICIAL = exports.PROJECT_TEMPLATES_CUSTOM = exports.PROJECT_TEMPLATES_OFFICIAL = exports.PROJECT_IS_LOCAL = exports.PROJECT_ENV = exports.LICENSE_PATH = exports.PROJECT_PATH = exports.PROXY_PATH = exports.DATA_PATH = exports.GORILLAJS_PATH = exports.HOME_USER_PATH_FOR_SCRIPTS = exports.HOME_USER_PATH_FOR_BASH = undefined;

var _yargs = require('yargs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOME_USER_PATH_FOR_BASH = exports.HOME_USER_PATH_FOR_BASH = process.env.APPDATA || '$HOME';
var HOME_USER_PATH_FOR_SCRIPTS = exports.HOME_USER_PATH_FOR_SCRIPTS = process.env.APPDATA || process.env.HOME;

var GORILLAJS_PATH = exports.GORILLAJS_PATH = _path2.default.resolve(__dirname);
var DATA_PATH = exports.DATA_PATH = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'data');
var PROXY_PATH = exports.PROXY_PATH = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'proxy');
var PROJECT_PATH = exports.PROJECT_PATH = _yargs.argv.path ? _path2.default.resolve(_yargs.argv.path) : process.cwd();
var LICENSE_PATH = exports.LICENSE_PATH = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'license.txt');

var PROJECT_ENV = exports.PROJECT_ENV = _yargs.argv.env ? _yargs.argv.env : 'local';
var PROJECT_IS_LOCAL = exports.PROJECT_IS_LOCAL = _yargs.argv.public ? false : true;
var PROJECT_TEMPLATES_OFFICIAL = exports.PROJECT_TEMPLATES_OFFICIAL = _path2.default.join(GORILLAJS_PATH, 'templates');
var PROJECT_TEMPLATES_CUSTOM = exports.PROJECT_TEMPLATES_CUSTOM = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'templates');
var PROJECT_PLUGINS_OFFICIAL = exports.PROJECT_PLUGINS_OFFICIAL = _path2.default.join(GORILLAJS_PATH, 'plugins');
var PROJECT_PLUGINS_CUSTOM = exports.PROJECT_PLUGINS_CUSTOM = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'plugins');

var SYSTEM_HOSTS_FILE = exports.SYSTEM_HOSTS_FILE = process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
var SCHEMA_PATH = exports.SCHEMA_PATH = _path2.default.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'schema.json');
var DEBUG = exports.DEBUG = _yargs.argv.d ? true : false;