'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Plugins = function () {
    function Plugins() {
        _classCallCheck(this, Plugins);

        // Incluyo todos los plugins.
        var files = '{' + _const.PROJECT_PLUGINS_OFFICIAL + ',' + _const.PROJECT_PLUGINS_CUSTOM + '}/**/config.json';

        // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _glob2.default.sync(files)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var file = _step.value;


                var json = JSON.parse((0, _fs.readFileSync)(file, 'utf8'));

                if (json.plugin) {

                    var main = _path2.default.join(_path2.default.dirname(file), json.plugin.main);

                    require(main);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    _createClass(Plugins, [{
        key: 'add',
        value: function add(source) {}
    }, {
        key: 'remove',
        value: function remove(name) {}
    }, {
        key: 'installDependencies',
        value: function installDependencies(pluginPath) {

            var packagePath = void 0;

            // // Si es un directorio...
            // if(fs.lstatSync(pluginPath).isDirectory()){
            //
            //     packagePath = path.join(pluginPath, 'package.json');
            //
            //     // Si existe un archivo package.json, lo ejecuto para instalar las dependencias.
            //     if(fs.existsSync(packagePath)){
            //
            //         cross.exec('npm install --prefix ' + pluginPath, function(err, stdout, stderr){
            //
            //             events.publish('VERBOSE', [err, stderr, stdout]);
            //
            //             events.publish('PROMISEME');
            //
            //         });
            //
            //     }
            //
            // }
        }
    }, {
        key: 'list',
        get: function get() {}
    }]);

    return Plugins;
}();

exports.default = Plugins;