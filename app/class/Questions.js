'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _inquirer = require('inquirer');

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Questions = function () {
    function Questions(schema, config) {
        _classCallCheck(this, Questions);

        this.schema = schema;
        this.config = config;
    }

    _createClass(Questions, [{
        key: 'process',
        value: function process(callback) {

            var unanswered = [];

            // Creo una función recursiva para ir haciendo las preguntas y guardando los valores en el objeto config.
            var recursive = function recursive(base, data) {

                // Recorro todos los nodos del objeto que recibo.
                for (var key in data) {

                    if (data[key].question) {
                        // Si el objeto contiene una pregunta...

                        if (!base[key] || base[key] === '') {
                            // ... y no está contestada todavía, la añado al array de preguntas.

                            // Almaceno la pregunta y la referencia al objeto global porque las preguntas las tengo que hacer al final de manera asíncrona.
                            unanswered.push({
                                'base': base,
                                'key': key,
                                'question': data[key]
                            });
                        }
                    } else if (_typeof(data[key]) === 'object') {
                        // Si es un objeto...

                        if (!base[key]) {
                            // ... y no existe, lo creo.

                            if (data[key] instanceof Array) {

                                base[key] = [];
                            } else {

                                base[key] = {};
                            }
                        }

                        // Continúo recorriendo el objeto.
                        recursive(base[key], data[key]);
                    } // Si no es nada de lo anterior, lo ignoro.
                }
            };

            recursive(this.config, this.schema.schema);

            // Le muestro las preguntas al usuario.
            this.showToUser(unanswered, callback);
        }
    }, {
        key: 'showToUser',
        value: function showToUser(questions, callback) {
            var _this = this;

            var check = function check() {

                if (questions.length) {

                    question(questions.shift());
                } else {

                    callback(_this.config);
                }
            };

            // Le muestro las preguntas al usuario de forma asíncrona. Así que creo una función que pueda volver a llamar, si es necesario, en el callback de la pregunta. 
            var question = function question(data) {

                // Compruebo si la pregunta ya había sido contestada.
                if (data.base[data.key]) {

                    check();

                    return;
                }

                // Compruebo si la pregunta depende de algún otro valor.
                if (data.question.depends_on) {

                    if (data.question.depends_on instanceof Array === false) {

                        data.question.depends_on = [data.question.depends_on];
                    }

                    var ignore = void 0;

                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = data.question.depends_on[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var dependency = _step.value;


                            var dependencies = _jspath2.default.apply(dependency.path, _this.config);

                            if (!dependencies.length && !data.waiting) {
                                // Si el nodo no existe en el archivo de configuración...

                                data.waiting = true;
                                questions.push(data);

                                ignore = true;
                            } else {
                                // Si el nodo existe compruebo si su valor aparece dentro de las dependencias necesarias para mostrar la pregunta.

                                if (_typeof(dependency.value) === 'object') {
                                    // Si es un objeto doy por hecho que es un array.

                                    if (dependency.value.indexOf(dependencies[0]) !== -1) {

                                        ignore = false;

                                        break;
                                    } else {

                                        ignore = true;
                                    }
                                } else {
                                    // Si no, es una cadena.

                                    if (dependency.value !== dependencies[0]) {

                                        ignore = true;
                                    } else {

                                        ignore = false;

                                        break;
                                    }
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

                    if (ignore) {

                        check();

                        return;
                    }
                }

                // Si llego aquí es porque he pasado todos los filtros y puedo hacer la pregunta.
                if (data.question.values && _typeof(data.question.values) === 'object') {
                    // Si hay más de una opción, muestro el prompt con el selector.

                    var list = [];

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = data.question.values[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var value = _step2.value;


                            if (list.indexOf(value.option) === -1) {

                                list.push(value.option);
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

                    var options = {
                        type: 'list',
                        name: 'result',
                        message: data.question.question,
                        choices: list
                    };

                    if (data.question.default) {

                        options.default = data.question.default;
                    }

                    (0, _inquirer.prompt)([options]).then(function (answer) {

                        // Recupero el valor de la opción que he seleccionado en el listado.
                        var value = _jspath2.default.apply('.values{.option === "' + answer.result + '"}', data.question);

                        data.base[data.key] = value[0].value;

                        check();
                    });
                } else if (data.question.question.indexOf('pass') > -1) {

                    var _options = {
                        type: 'password',
                        name: 'result',
                        step: data.question.key,
                        message: data.question.question
                    };

                    if (data.question.default) {

                        _options.default = data.question.default;
                    }

                    (0, _inquirer.prompt)([_options]).then(function (answer) {

                        data.base[data.key] = answer.result;

                        check();
                    });
                } else {

                    var _options2 = {
                        type: 'input',
                        name: 'result',
                        step: data.question.key,
                        message: data.question.question
                    };

                    if (data.question.default) {

                        _options2.default = data.question.default;
                    }

                    (0, _inquirer.prompt)([_options2]).then(function (answer) {

                        data.base[data.key] = answer.result;

                        check();
                    });
                }
            };

            check();
        }
    }]);

    return Questions;
}();

exports.default = Questions;