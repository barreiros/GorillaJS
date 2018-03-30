'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _Plugins = require('./Plugins.js');

var _Plugins2 = _interopRequireDefault(_Plugins);

var _Schema = require('./Schema.js');

var _Schema2 = _interopRequireDefault(_Schema);

var _Project = require('./Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _Questions = require('./Questions.js');

var _Questions2 = _interopRequireDefault(_Questions);

var _Docker = require('./Docker.js');

var _Docker2 = _interopRequireDefault(_Docker);

var _Tools = require('./Tools.js');

var _mergeJson = require('merge-json');

var _License = require('./License.js');

var _fs = require('fs');

var _fsExtra = require('fs-extra');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Processes = function () {
    function Processes() {
        _classCallCheck(this, Processes);
    }

    _createClass(Processes, [{
        key: 'build',
        value: function build() {

            // Recupero el schema.
            var schema = new _Schema2.default();

            // Recupero el proyecto.
            var project = new _Project2.default();

            // Hago las preguntas. Le paso la configuración del entorno actual del proyecto para no repetir preguntas.
            var questions = new _Questions2.default(schema.list, project.config[_const.PROJECT_ENV]);

            // Las llamadas a las preguntas son asíncronas, así que tengo que esperar al callback para seguir haciendo cualquier operación.
            questions.process(function (config) {

                var jsonEnv = {};
                var jsonComplementary = {};

                // Guardo la configuración del entorno actual en el archivo gorillafile
                jsonEnv[_const.PROJECT_ENV] = config;
                project.saveValue(jsonEnv);

                // Completo la configuración con otros valores necesarios, como el puerto del proxy, paths, etc.
                jsonComplementary = {
                    "proxy": {
                        "port": 80,
                        "userpath": _const.PROXY_PATH
                    },
                    "project": {
                        "slug": project.slug,
                        "protocol": "http",
                        "islocal": _const.PROJECT_IS_LOCAL
                    },
                    "docker": {
                        "port": Math.floor(Math.random() * (4999 - 4000)) + 4000,
                        "data_path": _const.DATA_PATH
                    }

                    // Unifico las variables complementarias con la configuración general.
                };config = (0, _mergeJson.merge)(jsonComplementary, config);

                // Lanzo un evento con la configuración por si los plugins necesitan aplicar algún cambio. 
                _Tools.events.publish('CONFIG_FILE_CREATED', [config]);

                // Muevo los archivos de la plantilla hasta su destino.
                var templateSource = (0, _fsExtra.pathExistsSync)(_path2.default.join(_const.PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type)) ? _path2.default.join(_const.PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type) : _path2.default.join(_const.PROJECT_TEMPLATES_CUSTOM, config.docker.template_type);
                var templateTarget = _path2.default.join(_const.PROJECT_PATH, '.gorilla', 'template');

                (0, _fsExtra.copySync)(templateSource, templateTarget);

                // Lanzo un evento antes de reemplazar los valores por si algún plugin necesita añadir archivos a la template. Le paso la ruta de la plantilla.
                _Tools.events.publish('BEFORE_REPLACE_VALUES', [templateTarget]);

                // Reemplazo las variables de la plantilla y del proxy por su valor correspondiente del objeto con la configuración que le paso.
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _glob2.default.sync('{' + templateTarget + '**/*,' + _const.PROJECT_TEMPLATES_OFFICIAL + '/proxy/**/*}')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var file = _step.value;


                        if (!(0, _fs.lstatSync)(file).isDirectory()) {

                            // Cargo el contenido del archivo.
                            var text = (0, _fs.readFileSync)(file).toString();

                            // Creo una expresión regular en lazy mode para que coja todos los valores, aunque haya varios en la misma línea.
                            text = text.replace(/{{(.*?)}}/g, function (search, value) {

                                // Reemplazo las ocurrencias por su valor correspondiente de la configuración.
                                return _jspath2.default.apply('.' + value, config)[0];
                            });

                            // Vuelvo a guardar el contenido del archivo con los nuevos valores.
                            (0, _fs.writeFileSync)(file, text);
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

                var docker = new _Docker2.default();

                if (docker.check()) {

                    // Detengo los contenedores del proyecto.
                    docker.stop(_path2.default.join(_const.PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml'), config.project.domain);

                    // Inicio los contenedores del proyecto.
                    docker.start(_path2.default.join(_const.PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml'), config.project.domain);

                    // Detengo el contenedor del proxy.
                    docker.stop(_path2.default.join(_const.PROJECT_TEMPLATES_OFFICIAL, 'proxy', 'docker-compose.yml'), 'gorillajsproxy');

                    // Inicio el contenedor del proxy.
                    docker.start(_path2.default.join(_const.PROJECT_TEMPLATES_OFFICIAL, 'proxy', 'docker-compose.yml'), 'gorillajsproxy');
                } else {

                    // Error Docker no está arranco o no está instalado.

                }

                _Tools.events.publish('PROJECT_BUILT');

                // Compruebo que el proyecto se haya iniciado correctamente.
            });
        }
    }, {
        key: 'run',
        value: function run() {

            console.log('Run');
        }
    }, {
        key: 'stop',
        value: function stop() {

            console.log('Stop');
        }
    }]);

    return Processes;
}();

exports.default = Processes;