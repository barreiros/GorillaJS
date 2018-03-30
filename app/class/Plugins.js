'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _Tools = require('./Tools.js');

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

        // Recupero todos los plugins.
        var files = '{' + _const.PROJECT_PLUGINS_OFFICIAL + ',' + _const.PROJECT_PLUGINS_CUSTOM + '}/*/config.json';

        this.checkForDependencies(files);

        this.include(files);
    }

    _createClass(Plugins, [{
        key: 'add',
        value: function add(source) {

            source = _path2.default.resolve(source);

            if ((0, _fsExtra.pathExistsSync)(source)) {

                (0, _fsExtra.copySync)(source, _path2.default.join(_const.PROJECT_PLUGINS_CUSTOM, _path2.default.basename(source)));

                (0, _Tools.execSync)('npm install -s', {
                    'cwd': _path2.default.join(_const.PROJECT_PLUGINS_CUSTOM, _path2.default.basename(source))
                });
            } else {

                // Error carpeta no existe.

            }
        }
    }, {
        key: 'remove',
        value: function remove(name) {

            var files = _const.PROJECT_PLUGINS_CUSTOM + '/*/config.json';

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _glob2.default.sync(files)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var file = _step.value;


                    var json = JSON.parse((0, _fs.readFileSync)(file, 'utf8'));

                    // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
                    if (json.plugin) {

                        if (json.plugin.name === name) {

                            // Elimino el plugin
                            (0, _fsExtra.removeSync)(_path2.default.dirname(file));

                            break;
                        }
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
    }, {
        key: 'reinstall',
        value: function reinstall() {

            var files = '{' + _const.PROJECT_PLUGINS_OFFICIAL + ',' + _const.PROJECT_PLUGINS_CUSTOM + '}/*/config.json';

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _glob2.default.sync(files)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var file = _step2.value;


                    // Instalo las dependencias.
                    if ((0, _fsExtra.pathExistsSync)(_path2.default.join(_path2.default.dirname(file), 'package.json'))) {

                        (0, _Tools.execSync)('npm install', {
                            'cwd': _path2.default.dirname(file)
                        });
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }, {
        key: 'checkForDependencies',
        value: function checkForDependencies(files) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {

                for (var _iterator3 = _glob2.default.sync(files)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var file = _step3.value;


                    // Instalo las dependencias, si es necesario.
                    if (!(0, _fsExtra.pathExistsSync)(_path2.default.join(_path2.default.dirname(file), 'node_modules')) && (0, _fsExtra.pathExistsSync)(_path2.default.join(_path2.default.dirname(file), 'package.json'))) {

                        (0, _Tools.execSync)('npm install -s', {
                            'cwd': _path2.default.dirname(file)
                        });
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    }, {
        key: 'include',
        value: function include(files) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {

                for (var _iterator4 = _glob2.default.sync(files)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var file = _step4.value;


                    var json = JSON.parse((0, _fs.readFileSync)(file, 'utf8'));

                    // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
                    if (json.plugin) {

                        var main = _path2.default.join(_path2.default.dirname(file), json.plugin.main);

                        // Incluyo el archivo en el proyecto.
                        require(main);
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: 'list',
        get: function get() {

            var files = '{' + _const.PROJECT_PLUGINS_OFFICIAL + ',' + _const.PROJECT_PLUGINS_CUSTOM + '}/*/config.json';
            var output = '';

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _glob2.default.sync(files)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var file = _step5.value;


                    var json = JSON.parse((0, _fs.readFileSync)(file, 'utf8'));

                    if (json.plugin) {

                        output += json.plugin.name + ' - ' + json.plugin.version + '\n';
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return output;
        }
    }]);

    return Plugins;
}();

exports.default = Plugins;