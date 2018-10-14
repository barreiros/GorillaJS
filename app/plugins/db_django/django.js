'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Events = require('../../class/Events.js');

var _Tools = require('../../class/Tools.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Django = function () {
    function Django() {
        _classCallCheck(this, Django);

        _Events.events.subscribe('BEFORE_REPLACE_VALUES', this.copyTemplate);
        _Events.events.subscribe('AFTER_REPLACE_VALUES', this.configureEngine);
        _Events.events.subscribe('PROJECT_BUILT', this.commitSettings);
    }

    _createClass(Django, [{
        key: 'copyTemplate',
        value: function copyTemplate(config, templateTarget) {

            // Si la proyecto es de Django copio los archivos del motor de base de datos a la carpeta de la plantilla.
            if (config.docker.template_type === 'django') {

                var engine = config.database.engine.toLowerCase();

                if (engine === 'postgresql') {

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-web.sh'), _path2.default.join(templateTarget, 'entrypoint-web.sh'));

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-postgresql.sh'), _path2.default.join(templateTarget, 'entrypoint-postgresql.sh'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'postgresql.conf'), _path2.default.join(templateTarget, 'postgresql.conf'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-postgresql.yml'), _path2.default.join(templateTarget, 'docker-compose-postgresql.yml'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'settings-postgresql'), _path2.default.join(templateTarget, 'settings-postgresql'));
                } else if (engine === 'mysql') {

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-web.sh'), _path2.default.join(templateTarget, 'entrypoint-web.sh'));

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-mysql.sh'), _path2.default.join(templateTarget, 'entrypoint-mysql.sh'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-mysql.yml'), _path2.default.join(templateTarget, 'docker-compose-mysql.yml'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'settings-mysql'), _path2.default.join(templateTarget, 'settings-mysql'));
                }
            }
        }
    }, {
        key: 'configureEngine',
        value: function configureEngine(config, templateTarget) {

            if (config.docker.template_type === 'django') {

                var file = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose.yml'));
                var engine = config.database.engine.toLowerCase();

                if (!file.services['web'].dependes_on) {

                    file.services['web'].depends_on = [];
                }

                if (engine === 'postgresql') {

                    var engineFile = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose-postgresql.yml'));

                    file.services['postgresql'] = engineFile.services.postgresql;
                    file.services['web'].depends_on.push('postgresql');
                    (0, _fs.writeFileSync)(_path2.default.join(templateTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
                } else if (engine === 'mysql') {

                    var _engineFile = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose-mysql.yml'));

                    file.services['mysql'] = _engineFile.services.postgresql;
                    file.services['web'].depends_on.push('mysql');
                    (0, _fs.writeFileSync)(_path2.default.join(templateTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
                }
            }
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.docker.template_type === 'django') {

                if (!config.services || _const.FORCE) {// Si no he hecho ningún commit, lo creo para guardar la configuración.

                    // let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

                }
            }
        }
    }]);

    return Django;
}();

exports.default = new Django();