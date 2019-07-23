'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _yargs = require('yargs');

var _Tools = require('../../class/Tools.js');

var _fsExtra = require('fs-extra');

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DBManager = function () {
    function DBManager() {
        _classCallCheck(this, DBManager);

        this.init();
    }

    _createClass(DBManager, [{
        key: 'init',
        value: function init() {

            if (_yargs.argv._[0] === 'db') {

                if (_yargs.argv._[1] === 'import') {

                    if ((0, _fsExtra.pathExistsSync)(_yargs.argv._[2])) {

                        this.import(_yargs.argv._[2]);
                    } else {

                        // Error archivo no existe.

                    }
                } else if (_yargs.argv._[1] === 'replace') {

                    if ((0, _fsExtra.pathExistsSync)(_yargs.argv._[2])) {

                        this.replace(_yargs.argv._[2]);
                    } else {

                        // Error archivo no existe.

                    }
                } else if (_yargs.argv._[1] === 'export') {

                    (0, _fsExtra.ensureFileSync)(_yargs.argv._[2]);
                    this.export(_yargs.argv._[2]);
                } else if (_yargs.argv._[1] === 'extra') {

                    this.extra(_yargs.argv._[2]);
                } else if (_yargs.argv._[1] === 'show') {

                    this.show();
                }
            } else if (_yargs.argv._[1] === 'clone') {

                // Routemap

            }
        }
    }, {
        key: 'extra',
        value: function extra(name) {

            var project = new _Project2.default();
            var config = project.config[_const.PROJECT_ENV];

            // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
            var engine = _jspath2.default.apply('..config.ase.engine', config);

            if (engine.indexOf('mysql'.toLowerCase())) {

                var command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "CREATE DATABASE ' + name + '" ';

                var query = (0, _Tools.execSync)(command);

                if (!query.err) {

                    console.log('Done! Extra database created');
                }
            }
        }
    }, {
        key: 'show',
        value: function show() {

            var project = new _Project2.default();
            var config = project.config[_const.PROJECT_ENV];

            // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
            var engine = _jspath2.default.apply('..config.ase.engine', config);

            if (engine.indexOf('mysql'.toLowerCase())) {

                var command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "SHOW DATABASES" ';

                var query = (0, _Tools.execSync)(command);

                if (!query.err) {

                    console.log(query.stdout);
                }
            }
        }
    }, {
        key: 'import',
        value: function _import(source) {

            var project = new _Project2.default();
            var config = project.config[_const.PROJECT_ENV];

            // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
            var engine = _jspath2.default.apply('..config.ase.engine', config);

            if (engine.indexOf('mysql'.toLowerCase())) {

                // Step iniciando el proceso de importación.

                var command = 'docker exec -i ' + config.project.domain + '_mysql mysql --force -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' < "' + source + '"';

                var query = (0, _Tools.execSync)(command);

                if (!query.err) {

                    // Step importación correcta.

                }
            }
        }
    }, {
        key: 'export',
        value: function _export(target) {

            var project = new _Project2.default();
            var config = project.config[_const.PROJECT_ENV];

            // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
            var engine = _jspath2.default.apply('..config.ase.engine', config);

            if (engine.indexOf('mysql'.toLowerCase())) {

                // Step iniciando el proceso de importación.

                var command = 'docker exec -i ' + config.project.domain + '_mysql mysqldump -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' > ' + target;

                var query = (0, _Tools.execSync)(command);

                if (!query.err) {

                    // Step exportación correcta.

                }
            }
        }
    }, {
        key: 'replace',
        value: function replace(source) {

            var project = new _Project2.default();
            var config = project.config[_const.PROJECT_ENV];

            // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
            var engine = _jspath2.default.apply('..config.ase.engine', config);

            if (engine.indexOf('mysql'.toLowerCase())) {

                // Step iniciando el proceso de reemplazo

                var command = '';

                command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "DROP DATABASE ' + config.database.dbname + '" ';

                var query = (0, _Tools.execSync)(command);

                if (!query.err) {

                    command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "CREATE DATABASE ' + config.database.dbname + '"';

                    query = (0, _Tools.execSync)(command);

                    if (!query.err) {

                        command = 'docker exec -i ' + config.project.domain + '_mysql mysql --force -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' < "' + source + '"';

                        query = (0, _Tools.execSync)(command);

                        if (!query.err) {

                            // Step proceso de reemplazo correcto.

                        }
                    }
                }
            }
        }
    }]);

    return DBManager;
}();

exports.default = new DBManager();