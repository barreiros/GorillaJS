#! /usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _Plugins = require('./class/Plugins.js');

var _Plugins2 = _interopRequireDefault(_Plugins);

var _Processes = require('./class/Processes.js');

var _Processes2 = _interopRequireDefault(_Processes);

var _Schema = require('./class/Schema.js');

var _Schema2 = _interopRequireDefault(_Schema);

var _Project = require('./class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 * Please, read the license: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
 *
 **/

var Main = function Main() {
    _classCallCheck(this, Main);

    // Genero, si no lo está, el archivo de configuración. Este archivo contiene, entre otras cosas, los textos de error.

    // Compruebo la entrada del usuario.
    if (process.env.hasOwnProperty('SUDO_USER')) {

        // Error: No se puede usar sudo.

    } else if (_yargs.argv._[0] === 'plugin') {

        // Imprimo el logo.

        // Instancio la clase Plugins
        var plugins = new _Plugins2.default();

        if (_yargs.argv._[1] === 'add') {} else if (_yargs.argv._[1] === 'remove') {} else if (_yargs.argv._[1] === 'list') {}
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
};

new Main();