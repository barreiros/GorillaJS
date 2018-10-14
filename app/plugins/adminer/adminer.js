'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Events = require('../../class/Events.js');

var _Tools = require('../../class/Tools.js');

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Adminer = function () {
    function Adminer() {
        _classCallCheck(this, Adminer);

        _Events.events.subscribe('PROJECT_BUILT', this.check.bind(this));
        _Events.events.subscribe('PROJECT_REMOVED', this.remove.bind(this));
        _Events.events.subscribe('PROJECT_MAINTENANCE', this.maintenance.bind(this));
    }

    _createClass(Adminer, [{
        key: 'check',
        value: function check(config) {

            var adminerPath = _path2.default.join(_const.PROXY_PATH, 'template', 'adminer');
            var listFile = _path2.default.join(_const.HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'adminer.json');

            if (!(0, _fsExtra.pathExistsSync)(listFile)) {
                // Me aseguro de que el archivo de configuración existe.

                (0, _fs.writeFileSync)(listFile, '{}');
            }

            // Cargo el archivo de configuración de Adminer.
            var list = JSON.parse((0, _fs.readFileSync)(listFile, 'utf8'));

            (0, _fsExtra.ensureDirSync)(adminerPath);

            // Compruebo si el proyecto actual existe en el archivo.
            if (!list[config.project.domain]) {
                // Si no existe, lo añado.

                list[config.project.domain] = {};

                this.add(list[config.project.domain]);

                // Guardo la lista actualizada.
                (0, _fs.writeFileSync)(listFile, JSON.stringify(list, null, '\t'));

                // Copio el listado en la carpeta pública de Adminer.
                (0, _fsExtra.copySync)(listFile, _path2.default.join(adminerPath, 'public', 'list.json'));
            } else if (!(0, _fsExtra.pathExistsSync)(_path2.default.join(adminerPath, 'public', 'list.json'))) {
                // Si no existe el archivo list en la carpeta pública, lo copio.

                // Copio el listado en la carpeta pública de Adminer.
                (0, _fsExtra.copySync)(listFile, _path2.default.join(adminerPath, 'public', 'list.json'));
            }

            if (!(0, _fsExtra.pathExistsSync)(_path2.default.join(adminerPath, 'public')) || !(0, _fsExtra.pathExistsSync)(_path2.default.join(adminerPath, 'server'))) {
                // Si los archivos de Adminer no están en la carpeta del proxy, los añado.

                (0, _fsExtra.ensureDirSync)(adminerPath);

                // Copio todos los archivos de Adminer en la carpeta de la template del proxy. Esto es nuevo y tengo que rectificar los archivos .sh
                (0, _fsExtra.copySync)(_path2.default.join(_path2.default.resolve(__dirname), 'public'), _path2.default.join(adminerPath, 'public'));
                (0, _fsExtra.copySync)(_path2.default.join(_path2.default.resolve(__dirname), 'server'), _path2.default.join(adminerPath, 'server'));

                // Ejecuto el script de bash para terminar de configurar Adminer.
                var query = (0, _Tools.execSync)('docker exec gorillajsproxy /bin/sh /root/templates/adminer/server/adminer.sh');

                this.commitSettings();
            }
        }
    }, {
        key: 'add',
        value: function add(list) {

            var composeFile = _path2.default.join(_const.PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml');

            // Creo un array con los motores de adminer.
            var engines = ['mysql', 'mariadb', 'sqlite', 'postgresql', 'mongodb', 'oracle', 'elasticsearch'];

            // Cargo el archivo docker-compose.
            var file = _yamljs2.default.load(composeFile);

            // Lo parseo en busca de servicios que tengan en el nombre alguna de las cadenas del array "engines"

            var _loop = function _loop() {

                var containerName = file.services[service].container_name;

                engines.map(function (engine) {

                    // Si el nombre del contenedor incluye el nombre de una tecnología de base de datos, lo incluyo en la lista.
                    if (containerName.toLowerCase().search(engine) !== -1) {

                        list[containerName] = engine;
                    }
                });
            };

            for (var service in file.services) {
                _loop();
            }
        }
    }, {
        key: 'remove',
        value: function remove(config) {}
    }, {
        key: 'maintenance',
        value: function maintenance() {}
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            var query = (0, _Tools.execSync)('gorilla commit gorillajsproxy');
        }
    }]);

    return Adminer;
}();

exports.default = new Adminer();