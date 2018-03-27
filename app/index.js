#! /usr/bin/env node
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/**
 *
 * Please, read the license: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
 *
 **/

var _yargs = require('yargs');

var _Plugins = require('./class/Plugins.js');

var _Plugins2 = _interopRequireDefault(_Plugins);

var _Processes = require('./class/Processes.js');

var _Processes2 = _interopRequireDefault(_Processes);

var _Schema = require('./class/Schema.js');

var _Schema2 = _interopRequireDefault(_Schema);

var _Project = require('./class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _License = require('./class/License.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Main = function () {
    function Main() {
        var _this = this;

        _classCallCheck(this, Main);

        // Inicio la licencia.
        _License.license.check(function (type) {

            // Continúo 
            _this.router();
        });
    }

    _createClass(Main, [{
        key: 'router',
        value: function router() {

            // Compruebo la entrada del usuario.
            if (process.env.hasOwnProperty('SUDO_USER')) {

                // Error: No se puede usar sudo.

            } else if (_yargs.argv._[0] === 'license') {

                // Imprimo el logo.

                // Añado la licencia.
                if (_yargs.argv._[1]) {

                    _License.license.add(_yargs.argv._[1]);
                } else {

                    // Error de número de licencia no existe.

                }
            } else if (_yargs.argv._[0] === 'plugin') {

                // Imprimo el logo.

                if (_License.license.type === 'PRO') {

                    // Instancio la clase Plugins
                    var plugins = new _Plugins2.default();

                    if (_yargs.argv._[1] === 'add') {} else if (_yargs.argv._[1] === 'remove') {} else if (_yargs.argv._[1] === 'list') {}
                }
            } else if (_yargs.argv._[0] === 'template') {

                // Imprimo el logo.

                if (_License.license.type === 'PRO') {

                    // Instancio la clase Plugins
                    // let templates = new Templates()
                    //
                    // if(argv._[1] === 'add'){
                    //
                    // }else if(argv._[1] === 'remove'){
                    //
                    // }else if(argv._[1] === 'list'){
                    //
                    // }

                }
            } else if (_yargs.argv._[0] === 'build') {

                // Imprimo el logo.

                var processes = new _Processes2.default();
                processes.build();
            } else if (_yargs.argv._[0] === 'run') {

                // Imprimo el logo.

                var _processes = new _Processes2.default();
                _processes.run();
            } else if (_yargs.argv._[0] === 'stop') {

                // Imprimo el logo.

                var _processes2 = new _Processes2.default();
                _processes2.stop();
            } else if (_yargs.argv._[0] === 'schema') {

                var schema = new _Schema2.default(_yargs.argv.force);
                var json = schema.list;

                if (_yargs.argv.project) {
                    // Si en la llamada viene el parámetro "project" devuelvo también el gorillafile con la configuración del proyecto.

                    // El constructor de la clase Project permite pasarle el path hacia un proyecto concreto.
                    var project = new _Project2.default();
                    json.config = project.config;
                }

                // Devuelvo el json.
                console.log(JSON.stringify(json));
            }
        }
    }]);

    return Main;
}();

new Main();