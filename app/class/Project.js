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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Project = function () {
    function Project() {
        var projectPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _const.PROJECT_PATH;

        _classCallCheck(this, Project);

        this.gorillaFilePath = _path2.default.join(projectPath, '.gorilla', 'gorillafile');
        this.projectPath = projectPath;

        if (!(0, _fsExtra.pathExistsSync)(this.gorillaFilePath)) {
            // Si el archivo gorillafile no existe, creo un nuevo proyecto.

            this.createProject();
        }
    }

    _createClass(Project, [{
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
    }]);

    return Project;
}();

exports.default = Project;