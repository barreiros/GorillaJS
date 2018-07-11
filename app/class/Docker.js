'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _Tools = require('./Tools.js');

var _fs = require('fs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Docker = function () {
        function Docker() {
                _classCallCheck(this, Docker);
        }

        _createClass(Docker, [{
                key: 'check',
                value: function check() {

                        var query = void 0;

                        // Compruebo si docker está instalado y funcionando.
                        query = (0, _Tools.execSync)('docker ps');

                        if (query.err) {

                                return false;
                        }

                        // Compruebo si docker está instalado y funcionando.
                        query = (0, _Tools.execSync)('docker-compose -v');

                        if (query.err) {

                                return false;
                        }

                        return true;
                }
        }, {
                key: 'start',
                value: function start(composeFile, slug) {
                        var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


                        var command = void 0;

                        if (force) {

                                command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --remove-orphans --force-recreate -d';
                        } else {

                                command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --remove-orphans -d';
                        }

                        (0, _Tools.execSync)(command);
                }
        }, {
                key: 'stop',
                value: function stop(composeFile, slug) {

                        if (!composeFile) {

                                (0, _Tools.execSync)('docker stop $(docker ps -aq) && docker rm $(docker ps -aq)');
                        } else {

                                (0, _Tools.execSync)('docker-compose -p "' + slug + '" rm -f -s -v', {
                                        cwd: _path2.default.dirname(composeFile)
                                });
                        }
                }
        }, {
                key: 'nameContainers',
                value: function nameContainers(composeFile, name) {

                        var file = _yamljs2.default.load(composeFile);

                        for (var _key in file.services) {

                                if (!file.services[_key].container_name) {

                                        file.services[_key].container_name = name + '_' + _key;
                                }
                        }

                        (0, _fs.writeFileSync)(composeFile, _yamljs2.default.stringify(file, 6));
                }
        }, {
                key: 'assignCustomContainers',
                value: function assignCustomContainers(composeFile, config) {

                        if (config.services) {

                                var file = _yamljs2.default.load(composeFile);

                                for (var _key2 in config.services) {

                                        if (file.services[_key2]) {

                                                file.services[_key2].image = config.services[_key2];
                                        }
                                }

                                (0, _fs.writeFileSync)(composeFile, _yamljs2.default.stringify(file, 6));
                        }
                }
        }, {
                key: 'commit',
                value: function commit(composeFile, gorillaFile, name) {

                        if (name === 'gorillajsproxy') {

                                (0, _Tools.execSync)('docker commit -p=false gorillajsproxy gorillajs/proxy');
                        } else {

                                var file = _yamljs2.default.load(composeFile);
                                var config = JSON.parse((0, _fs.readFileSync)(gorillaFile));
                                var service = void 0;

                                for (key in file.services) {

                                        if (file.services[key].container_name === name) {

                                                service = key;

                                                break;
                                        }
                                }

                                if (service) {

                                        var image = void 0;

                                        if (config[_const.PROJECT_ENV].services) {

                                                for (var key in config[_const.PROJECT_ENV].services) {

                                                        if (config[_const.PROJECT_ENV].services[key] === service) {

                                                                image = config[_const.PROJECT_ENV].services[key];
                                                        }
                                                }
                                        } else {

                                                config[_const.PROJECT_ENV].services = {};
                                        }

                                        // Si no existía una imagen creada para este servicio, genero el nombre (project.ID* + service.name).
                                        if (!image) {

                                                image = config[_const.PROJECT_ENV].project.id + '/' + service;

                                                // Actualizo el gorillafile con el nombre 
                                                config[_const.PROJECT_ENV].services[service] = image;

                                                (0, _fs.writeFileSync)(gorillaFile, JSON.stringify(config, null, '\t'));
                                        }

                                        // Creo el commit pasándole name e image.
                                        (0, _Tools.execSync)('docker commit -p=false ' + name + ' ' + image);
                                } else {

                                        // Error no existe un contenedor con ese nombre.

                                }
                        }
                }
        }, {
                key: 'network',
                value: function network() {

                        var containers = (0, _Tools.execSync)('docker network ls --format="{{.Name}}"');

                        if (containers.stdout.search('gorillajs') === -1) {

                                (0, _Tools.execSync)('docker network create --driver bridge gorillajs');
                        }
                }
        }, {
                key: 'maintenance',
                value: function maintenance() {

                        // Elimino los contenedores, redes e imágenes que no se usan.
                        (0, _Tools.execSync)('docker system prune -af');

                        // Estudiar si es viable usar esta librería para controlar el error de max depth exceed: https://github.com/goldmann/docker-squash
                }
        }]);

        return Docker;
}();

exports.default = Docker;