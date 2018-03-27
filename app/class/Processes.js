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

var _Tools = require('./Tools.js');

var _mergeJson = require('merge-json');

var _License = require('./License.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Processes = function () {
    function Processes() {
        _classCallCheck(this, Processes);
    }

    _createClass(Processes, [{
        key: 'build',
        value: function build() {

            if (_License.license.type === 'PRO') {

                // Inicio los plugins
                var plugins = new _Plugins2.default();
            }

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
                jsonComplementary[_const.PROJECT_ENV] = {
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
                _Tools.events.publish('PLUGINS_MODIFY_CONFIG', [config]);

                // console.log(config)

                // Muevo los archivos de la plantilla hasta su destino.

                // Reemplazo las variables de las plantillas por su valor correspondiente del objeto con la configuración que le paso.

                // Inicio las máquinas de Docker.

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