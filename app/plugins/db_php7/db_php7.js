'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _Events = require('../../class/Events.js');

var _yargs = require('yargs');

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
        var _this = this;

        _classCallCheck(this, DBforPHP7);

        _Events.events.subscribe('BEFORE_REPLACE_VALUES', function (config, templateTarget) {
            return _this.copyTemplate(config, templateTarget);
        });
        _Events.events.subscribe('AFTER_REPLACE_VALUES', function (config, templateTarget) {
            return _this.configureEngine(config, templateTarget);
        });
        _Events.events.subscribe('PROJECT_BUILT', this.commitSettings);

        // Configuro la opción de añadir una base de datos extra a cualquier proyecto.
        if (_yargs.argv._[0] === 'dbx') {

            this.addExtraDB(_yargs.argv._[1]);
        }
    }

    _createClass(DBforPHP7, [{
        key: 'addExtraDB',
        value: function addExtraDB(engine) {

            var project = new _Project2.default();
            var config = project.config;

            var validEngines = ['mysql', 'postgresql', 'mongodb'];

            if (validEngines.indexOf(engine) !== -1) {

                if (!config[_const.PROJECT_ENV].hasOwnProperty('database_extra')) {

                    config[_const.PROJECT_ENV].database_extra = {};
                    config[_const.PROJECT_ENV].database_extra.engines = [];
                }

                // Solo se permite un engine extra de cada tipo y compartiran las credenciales.
                if (config[_const.PROJECT_ENV].database_extra.engines.indexOf(engine) === -1) {

                    config[_const.PROJECT_ENV].database_extra.enable = "yes";
                    config[_const.PROJECT_ENV].database_extra.engines.push(engine);

                    project.saveValue(config);
                }

                console.log('Please, rebuild the project to install the new database');
            } else {

                console.log('Error - Missing or invalid engine. Valid engines are mysql, postgresql and mongodb.');
            }
        }
    }, {
        key: 'copyTemplate',
        value: function copyTemplate(config, templateTarget) {

            var engines = this.getEngines(config);

            if (engines.length > 0) {

                var webFile = _path2.default.join(templateTarget, 'entrypoint-web.sh');

                // Cargo el contenido del archivo.
                var text = (0, _fs.readFileSync)(webFile).toString();

                var hasChange = false;

                // Creo una expresión regular en lazy mode para que coja todos los valores, aunque haya varios en la misma línea.
                text = text.replace(/\n/, function (search, value) {

                    hasChange = true;

                    // Pendiente optimizar esta parte.
                    // Instalo todas las librerías relacionadas con los motores de base de datos que pueda necesitar.
                    return '\n apk update && apk add --no-cache postgresql postgresql-dev php7-pgsql mariadb-dev mariadb-dev php7-mongodb &&';
                });

                // Vuelvo a guardar el contenido del archivo con los nuevos valores.
                if (hasChange) {

                    (0, _fs.writeFileSync)(webFile, text);
                }

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = engines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var engine = _step.value;


                        if (engine === 'postgresql') {

                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-postgresql.sh'), _path2.default.join(templateTarget, 'entrypoint-postgresql.sh'));
                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'postgresql.conf'), _path2.default.join(templateTarget, 'postgresql.conf'));
                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-postgresql.yml'), _path2.default.join(templateTarget, 'docker-compose-postgresql.yml'));
                            // copySync(path.join(__dirname, 'index-postgresql.php'), path.join(templateTarget, 'test-postgresql.php'))
                        } else if (engine === 'mysql') {

                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-mysql.sh'), _path2.default.join(templateTarget, 'entrypoint-mysql.sh'));
                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-mysql.yml'), _path2.default.join(templateTarget, 'docker-compose-mysql.yml'));
                            // copySync(path.join(__dirname, 'index-mysql.php'), path.join(templateTarget, 'test-mysql.php'))
                        } else if (engine === 'mongodb') {

                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-mongo.sh'), _path2.default.join(templateTarget, 'entrypoint-mongo.sh'));
                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'mongo-create-user'), _path2.default.join(templateTarget, 'mongo-create-user'));
                            (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-mongo.yml'), _path2.default.join(templateTarget, 'docker-compose-mongo.yml'));
                            // copySync(path.join(__dirname, 'index-mongo.php'), path.join(templateTarget, 'test-mongo.php'))
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }
    }, {
        key: 'configureEngine',
        value: function configureEngine(config, templateTarget) {

            var engines = this.getEngines(config);

            if (engines.length > 0) {

                var file = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose.yml'));

                if (!file.services['web'].dependes_on) {

                    file.services['web'].depends_on = [];
                }

                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = engines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var engine = _step2.value;


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
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }
    }, {
        key: 'getEngines',
        value: function getEngines(config) {

            // Compruebo si la template es php 7 o si hay instalaciones extra de bases de datos.
            var engines = [];

            // Compruebo si la plantilla es de tipo php 7 y si tiene un engine asociado.
            if (config.docker.template_type === 'php-7') {

                if (config.database.hasOwnProperty('engine_php7')) {

                    engines.push(config.database.engine_php7.toLowerCase());
                }
            }

            // Compruebo si el proyecto tiene algún engine extra. Esto puede tenerlo cualquier proyecto, no solo los que usen la template de php 7.
            if (config.hasOwnProperty('database_extra')) {

                if (config.database_extra.hasOwnProperty('engines')) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {

                        for (var _iterator3 = config.database_extra.engines[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var engine = _step3.value;


                            if (engines.indexOf(engine) === -1) {

                                engines.push(engine);
                            }
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                }
            }

            return engines;
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.docker.template_type === 'php-7') {

                if (!config.services || _const.FORCE) {// Si no he hecho ningún commit, lo creo para guardar la configuración.

                    // let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

                }
            }
        }
    }]);

    return DBforPHP7;
}();

exports.default = new DBforPHP7();