'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _Schema = require('./Schema.js');

var _Schema2 = _interopRequireDefault(_Schema);

var _Project = require('./Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _Questions = require('./Questions.js');

var _Questions2 = _interopRequireDefault(_Questions);

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
            questions.process(function (answers) {

                var jsonEnv = {};

                // Guardo la configuración del entorno actual en el archivo gorillafile
                jsonEnv[_const.PROJECT_ENV] = answers;
                project.saveValue(jsonEnv);

                // Complemento el objeto de respuestas con variables / constantes para las que no son necesarias preguntas.
                // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
                // proxy.port
                // proxy.host
                // proxy.userpath
                // system.hostsfile
                // project.id
                // project.slug
                // project.protocol
                // project.islocal
                // docker.port
                // docker.data_path
                // docker.template
                // docker.template_path
                // docker.template.slug
                // docker.gorillafolder ¿¿??
                // docker.template_folder ¿¿??
                //
                // Guardo los resultados en el nodo del entorno del gorillafile.
                //
                // Muevo los archivos de la plantilla hasta su destino.
                //
                // Reemplazo las variables de las plantillas por su valor correspondiente del archivo de configuración.
                //
                // Inicio las máquinas de Docker.
                //
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