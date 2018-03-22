'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Processes = function () {
    function Processes() {
        _classCallCheck(this, Processes);
    }

    _createClass(Processes, [{
        key: 'build',
        value: function build() {

            console.log('Build');

            // Una vez recuperado el schema y hechas las preguntas todavía quedarán algunas variables de las plantillas que no están contempladas. Por ejemplo, docker.port. 
            // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
            // project.id
            // project.slug
            // docker.port
            // docker.data_path
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