'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Templates = function () {
        function Templates() {
                _classCallCheck(this, Templates);
        }

        _createClass(Templates, [{
                key: 'add',
                value: function add(source) {

                        source = _path2.default.resolve(source);

                        if ((0, _fsExtra.pathExistsSync)(source)) {

                                if ((0, _fsExtra.pathExistsSync)(_path2.default.join(source, 'config.json'))) {

                                        (0, _fsExtra.copySync)(source, _path2.default.join(_const.PROJECT_TEMPLATES_CUSTOM, _path2.default.basename(source)));
                                } else {

                                        // Error no existe el archivo config.json

                                }
                        } else {

                                        // Error carpeta no existe.

                                }
                }
        }, {
                key: 'remove',
                value: function remove(name) {

                        var template = _path2.default.join(_const.PROJECT_TEMPLATES_CUSTOM, name);

                        if ((0, _fsExtra.pathExistsSync)(template)) {

                                // Elimino la plantilla
                                (0, _fsExtra.removeSync)(template);
                        }
                }
        }, {
                key: 'list',
                get: function get() {

                        var files = '{' + _const.PROJECT_TEMPLATES_OFFICIAL + ',' + _const.PROJECT_TEMPLATES_CUSTOM + '}/*';
                        var output = '';

                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                                for (var _iterator = _glob2.default.sync(files)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                        var file = _step.value;


                                        if ((0, _fs.lstatSync)(file).isDirectory()) {

                                                output += _path2.default.basename(file) + '\n';
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

                        return output;
                }
        }]);

        return Templates;
}();

exports.default = Templates;