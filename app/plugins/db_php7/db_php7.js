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

var DBforPHP7 = function () {
    function DBforPHP7() {
        _classCallCheck(this, DBforPHP7);

        _Events.events.subscribe('BEFORE_REPLACE_VALUES', this.copyTemplate);
        _Events.events.subscribe('AFTER_REPLACE_VALUES', this.configureEngine);
        _Events.events.subscribe('PROJECT_BUILT', this.commitSettings);
    }

    _createClass(DBforPHP7, [{
        key: 'copyTemplate',
        value: function copyTemplate(config, templateTarget) {

            // Si el proyecto es de PHP7, copio los archivos del motor de base de datos a la carpeta de la plantilla.
            if (config.docker.template_type === 'php7') {

                var engine = config.database.engine_php7.toLowerCase();

                if (engine === 'postgresql') {

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-web.sh'), _path2.default.join(templateTarget, 'entrypoint-web.sh'));

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-postgresql.sh'), _path2.default.join(templateTarget, 'entrypoint-postgresql.sh'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'postgresql.conf'), _path2.default.join(templateTarget, 'postgresql.conf'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'index-postgresql.php'), _path2.default.join(templateTarget, 'index.php'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-postgresql.yml'), _path2.default.join(templateTarget, 'docker-compose-postgresql.yml'));
                } else if (engine === 'mysql') {

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-web.sh'), _path2.default.join(templateTarget, 'entrypoint-web.sh'));

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-mysql.sh'), _path2.default.join(templateTarget, 'entrypoint-mysql.sh'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'index-mysql.php'), _path2.default.join(templateTarget, 'index.php'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-mysql.yml'), _path2.default.join(templateTarget, 'docker-compose-mysql.yml'));
                } else if (engine === 'mongodb') {

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-web.sh'), _path2.default.join(templateTarget, 'entrypoint-web.sh'));

                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-mongo.sh'), _path2.default.join(templateTarget, 'entrypoint-mongo.sh'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'mongo-create-user'), _path2.default.join(templateTarget, 'mongo-create-user'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'index-mongo.php'), _path2.default.join(templateTarget, 'index.php'));
                    (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-mongo.yml'), _path2.default.join(templateTarget, 'docker-compose-mongo.yml'));
                }
            }
        }
    }, {
        key: 'configureEngine',
        value: function configureEngine(config, templateTarget) {

            if (config.docker.template_type === 'php7') {

                var file = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose.yml'));
                var engine = config.database.engine_php7.toLowerCase();

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

                    file.services['mysql'] = _engineFile.services.mysql;
                    file.services['web'].depends_on.push('mysql');
                    (0, _fs.writeFileSync)(_path2.default.join(templateTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
                } else if (engine === 'mongodb') {

                    var _engineFile2 = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose-mongo.yml'));

                    file.services['mongo'] = _engineFile2.services.mongo;
                    file.services['web'].depends_on.push('mongo');
                    (0, _fs.writeFileSync)(_path2.default.join(templateTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
                }
            }
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.docker.template_type === 'php7') {

                if (!config.services || _const.FORCE) {
                    // Si no he hecho ningún commit, lo creo para guardar la configuración.

                    var query = (0, _Tools.execSync)('gorilla6 commit "' + config.project.domain + '" --path "' + _const.PROJECT_PATH + '"');
                }
            }
        }
    }]);

    return DBforPHP7;
}();

exports.default = new DBforPHP7();