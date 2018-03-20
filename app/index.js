#! /usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _const = require('./const.js');

var _Plugins = require('./class/Plugins.js');

var _Plugins2 = _interopRequireDefault(_Plugins);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Main = function Main() {
    _classCallCheck(this, Main);

    // Genero, si no lo está, el archivo de configuración. Este archivo contiene, entre otras cosas, los textos de error.

    // Compruebo la entrada del usuario.
    if (process.env.hasOwnProperty('SUDO_USER')) {

        // Error: No se puede usar sudo.

    } else if (_yargs.argv._[0] === 'plugin') {

        // Imprimo el logo.

        // Instancio la clase Plugins y le paso los parámetros.
        var plugins = new _Plugins2.default(_yargs.argv);
    } else if (_yargs.argv._[0] === 'build') {

        // Imprimo el logo.

        console.log(_const.PROJECT_PATH);
    } else if (_yargs.argv._[0] === 'run') {

        // Imprimo el logo.

    }

    console.log(_yargs.argv);
};

new Main();