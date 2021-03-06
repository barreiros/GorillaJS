#! /usr/bin/env node
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/**
 *
 * Please, read the license: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
 *
 **/

var _yargs = require('yargs');

var _Templates = require('./class/Templates.js');

var _Templates2 = _interopRequireDefault(_Templates);

var _Plugins = require('./class/Plugins.js');

var _Plugins2 = _interopRequireDefault(_Plugins);

var _Processes = require('./class/Processes.js');

var _Processes2 = _interopRequireDefault(_Processes);

var _Schema = require('./class/Schema.js');

var _Schema2 = _interopRequireDefault(_Schema);

var _Project = require('./class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _License = require('./class/License.js');

var _SocketGuest = require('./class/SocketGuest.js');

var _SocketGuest2 = _interopRequireDefault(_SocketGuest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Main = function () {
    function Main() {
        _classCallCheck(this, Main);

        this.plugins = new _Plugins2.default();
        this.router();
    }

    _createClass(Main, [{
        key: 'router',
        value: function router() {

            // Compruebo la entrada del usuario.
            if (process.env.hasOwnProperty('SUDO_USER')) {

                console.log('GorillaJS has detect that you are in SUDOERS list. Please, if necessary, configure your system in order to do not use sudo command.');
                // Error: No se puede usar sudo.
            }

            if (_yargs.argv._[0] === 'license') {

                // Imprimo el logo.

                // Añado la licencia.
                if (_yargs.argv._[1]) {

                    _License.license.add(_yargs.argv._[1]);
                } else {

                    // Error de número de licencia no existe.

                }
            } else if (_yargs.argv._[0] === 'plugin' || _yargs.argv._[0] === 'plugins') {

                // Imprimo el logo.

                if (this.plugins) {

                    if (_yargs.argv._[1] === 'add') {

                        this.plugins.add(_yargs.argv._[2]);
                    } else if (_yargs.argv._[1] === 'remove') {

                        this.plugins.remove(_yargs.argv._[2]);
                    } else if (_yargs.argv._[1] === 'list') {

                        console.log(this.plugins.list);
                    } else if (_yargs.argv._[1] === 'reinstall') {

                        this.plugins.reinstall();
                    }
                } else {

                    // Error de contratación de plan PRO.

                }
            } else if (_yargs.argv._[0] === 'template' || _yargs.argv._[0] === 'templates') {

                // Imprimo el logo.

                if (_License.license.type === 'PRO') {

                    // Instancio la clase Templates
                    var templates = new _Templates2.default();

                    if (_yargs.argv._[1] === 'add') {

                        templates.add(_yargs.argv._[2]);
                    } else if (_yargs.argv._[1] === 'remove') {

                        templates.remove(_yargs.argv._[2]);
                    } else if (_yargs.argv._[1] === 'list') {

                        console.log(templates.list);
                    }
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
                _processes2.stop(_yargs.argv.all);
            } else if (_yargs.argv._[0] === 'remove') {

                // Imprimo el logo.

                var _processes3 = new _Processes2.default();
                _processes3.remove();
            } else if (_yargs.argv._[0] === 'maintenance') {

                // Imprimo el logo.

                var _processes4 = new _Processes2.default();
                _processes4.maintenance();
            } else if (_yargs.argv._[0] === 'commit' || _yargs.argv._[0] === 'save') {

                // Imprimo el logo.

                var _processes5 = new _Processes2.default();
                _processes5.commit(_yargs.argv._[1]);
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
            } else if (_yargs.argv._[0] === 'guest') {

                var guest = new _SocketGuest2.default();
            }
        }
    }]);

    return Main;
}();

new Main();