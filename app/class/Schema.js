'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Schema = function () {
    function Schema() {
        _classCallCheck(this, Schema);
    }

    _createClass(Schema, [{
        key: 'process',
        value: function process() {

            if (!(0, _fsExtra.pathExistsSync)(_const.SCHEMA_PATH)) {
                // Si no existe el archivo, lo genero.

                // Busco todos los archivos config.json de las carpetas de templates y plugins oficiales y personalizados.
                var files = '{' + _const.PROJECT_TEMPLATES_OFFICIAL + ', ' + _const.PROJECT_TEMPLATES_CUSTOM + ', ' + _const.PROJECT_PLUGINS_OFFICIAL + ', ' + _const.PROJECT_PLUGINS_CUSTOM + '}/**/config.json';

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _glob2.default.sync(files)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var file = _step.value;


                        var json = JSON.parse(_fs2.default.readFileSync(file, 'utf8'));

                        console.log(file);
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

            // return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
        }
    }]);

    return Schema;
}();

exports.default = Schema;