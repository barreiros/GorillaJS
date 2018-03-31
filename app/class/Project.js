'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _mergeJson = require('merge-json');

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Project = function () {
    function Project() {
        var projectPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _const.PROJECT_PATH;

        _classCallCheck(this, Project);

        this.gorillaFilePath = _path2.default.join(projectPath, '.gorilla', 'gorillafile');
        this.projectPath = projectPath;
        this.domainSlug = '';

        if (!(0, _fsExtra.pathExistsSync)(this.gorillaFilePath)) {
            // Si el archivo gorillafile no existe, creo un nuevo proyecto.

            this.createProject();
        } else {

            this.ensureEnv();
        }
    }

    _createClass(Project, [{
        key: 'ensureEnv',
        value: function ensureEnv() {

            // Recupero la configuración del proyecto y busco el nodo del entorno actual.
            var config = (0, _fs.readFileSync)(this.gorillaFilePath, 'utf8');

            // Si está vacío, creo un objeto.
            if (config === '') {

                config = {};
            } else {

                config = JSON.parse(config);
            }

            if (!config[_const.PROJECT_ENV]) {

                // Busco en toda la configuración el id del proyecto, por si estuviera en otro entorno.
                var id = _jspath2.default.apply('..project.id', config);

                if (id.length) {

                    config[_const.PROJECT_ENV] = {

                        project: {

                            id: id[0]

                        }

                    };

                    this.saveValue(config);
                } else {

                    this.createProject();
                }
            }
        }
    }, {
        key: 'createProject',
        value: function createProject() {

            var json = void 0;

            // Creo el archivo de configuración
            (0, _fsExtra.ensureFileSync)(this.gorillaFilePath);

            // Genero un ID único para el proyecto y lo guardo en el nuevo archivo de configuració que acabo de crear.
            json = {};
            json[_const.PROJECT_ENV] = {

                project: {

                    id: (0, _v2.default)()

                }

            };

            this.saveValue(json);
        }
    }, {
        key: 'clearConfig',
        value: function clearConfig() {
            var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


            // Recupero el actual archivo de configuración.
            var config = JSON.parse((0, _fs.readFileSync)(this.gorillaFilePath, 'utf8'));
            var id = config[_const.PROJECT_ENV].project.id;

            if (force) {
                // Elimino la confiración de todos los entornos, excepto el id de proyecto.

                config = {};
            }

            config[_const.PROJECT_ENV] = {

                project: {

                    id: id

                }

            };

            (0, _fs.writeFileSync)(this.gorillaFilePath, JSON.stringify(config, null, '\t'));
        }
    }, {
        key: 'saveValue',
        value: function saveValue(value) {

            // Recupero el actual archivo de configuración.
            var config = (0, _fs.readFileSync)(this.gorillaFilePath, 'utf8');

            // Si está vacío, creo un objeto.
            if (config === '') {

                config = {};
            } else {

                config = JSON.parse(config);
            }

            // Concateno el archivo actual con el nuevo valor (que siempre tiene que ser un json / objeto)
            (0, _fs.writeFileSync)(this.gorillaFilePath, JSON.stringify((0, _mergeJson.merge)(config, value), null, '\t'));
        }
    }, {
        key: 'config',
        get: function get() {

            return JSON.parse((0, _fs.readFileSync)(this.gorillaFilePath, 'utf8'));
        }
    }, {
        key: 'slug',
        get: function get() {

            if (this.domainSlug === '') {

                var config = JSON.parse((0, _fs.readFileSync)(this.gorillaFilePath, 'utf8'));
                var slug = config[_const.PROJECT_ENV].project.domain;
                var separator = '';

                if (slug) {

                    if (slug.charAt(0) === '/') {

                        slug = slug.substr(1);
                    }

                    slug = slug.replace(/^\s+|\s+$/g, ''); // trim
                    slug = slug.toLowerCase();

                    // remove accents, swap ñ for n, etc
                    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_-,:;";
                    for (var i = 0, l = from.length; i < l; i++) {
                        slug = slug.replace(new RegExp(from.charAt(i), 'g'), separator);
                    }

                    slug = slug.replace(/[^a-z0-9]/g, separator) // remove invalid chars
                    .replace(/\s+/g, separator) // collapse whitespace and replace by -
                    .replace(/-+/g, separator); // collapse dashes
                }

                this.domainSlug = slug;
            }

            return this.domainSlug;
        }
    }]);

    return Project;
}();

exports.default = Project;