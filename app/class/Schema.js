'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Schema = function () {
    function Schema() {
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        _classCallCheck(this, Schema);

        this.force = force;
    }

    _createClass(Schema, [{
        key: 'process',
        value: function process() {

            // Busco todos los archivos config.json de las carpetas de templates y plugins oficiales y personalizados.
            var files = '{' + _const.PROJECT_TEMPLATES_OFFICIAL + ',' + _const.PROJECT_TEMPLATES_CUSTOM + ',' + _const.PROJECT_PLUGINS_OFFICIAL + ',' + _const.PROJECT_PLUGINS_CUSTOM + '}/**/config.json';
            var output = void 0;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _glob2.default.sync(files)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var file = _step.value;


                    var json = JSON.parse((0, _fs.readFileSync)(file, 'utf8'));

                    if (json.schema) {

                        if (!output) {

                            output = {
                                "schema": json.schema
                            };
                        } else {
                            (function () {

                                // Creo una función recursiva para ir añadiendo los campos y así fusionar los json.
                                var recursive = function recursive(base, data) {

                                    // Recorro todos los nodos del objeto que recibo.
                                    for (var key in data) {

                                        if (data[key] instanceof Array && typeof data[key][0] === 'string') {
                                            // Si es un array de cadenas...

                                            if (!base[key]) {
                                                // ... y no existe el campo destino, creo el campo y le asigno el valor del array.

                                                base[key] = [];
                                            } else if (base[key] && base[key] instanceof Array) {
                                                // ... existe el campo destino y es un array, los fusiono. 

                                                base[key] = base[key].concat(data[key]);
                                            } else {
                                                // ... existe el campo destino y es una cadena, concateno los dos valores en un array.

                                                if (!data[key].includes(base[key])) {
                                                    // Solo si el valor no existe ya en el array.

                                                    base[key] = [base[key], data[key]];
                                                }
                                            }

                                            base[key].push(data[key]);
                                        } else if (data[key] instanceof Array && _typeof(data[key][0]) === 'object') {
                                            // Si es un array de objetos

                                            if (!base[key]) {
                                                // .. y no existe el campo destino, lo creo y vuelvo a ejecutar el proceso.

                                                base[key] = [];

                                                recursive(base[key], data[key]);
                                            } else if (base[key] && base[key] instanceof Array) {

                                                base[key] = base[key].concat(data[key]);
                                            } else if (base[key] && _typeof(base[key]) === 'object') {

                                                data[key].push(base[key]);
                                                base[key] = data[key];
                                            }
                                        } else if (_typeof(data[key]) === 'object') {

                                            if (!base[key]) {

                                                base[key] = {};
                                            }

                                            recursive(base[key], data[key]);
                                        } else {
                                            // Doy por hecho que el valor que viene es una cadena.

                                            if (!base[key]) {
                                                // Si el campo de destin no existe, le asigno el valor.

                                                base[key] = data[key];
                                            } else if (base[key] && typeof data[key] === 'string') {
                                                // Si el campo de destino existe y tiene una cadena, los uno en un array.

                                                if (base[key].toString() !== data[key].toString()) {
                                                    // Solo si son distintas.

                                                    base[key] = [base[key], data[key]];
                                                }
                                            } else {
                                                // Si el campo de destino existe y es un array, añado el valor al array.

                                                base[key].push(data[key]);
                                            }
                                        }
                                    }
                                };

                                recursive(output.schema, json.schema);
                            })();
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

            (0, _fsExtra.ensureFileSync)(_const.SCHEMA_PATH);
            (0, _fs.writeFileSync)(_const.SCHEMA_PATH, JSON.stringify(output, null, '\t'));

            return output;
        }
    }, {
        key: 'list',
        get: function get() {

            if (!(0, _fsExtra.pathExistsSync)(_const.SCHEMA_PATH) || this.force) {
                // Si no existe el archivo, o está forzada la creación, lo genero.

                return this.process();
            } else {

                return JSON.parse((0, _fs.readFileSync)(_const.SCHEMA_PATH, 'utf8'));
            }
        }
    }]);

    return Schema;
}();

exports.default = Schema;