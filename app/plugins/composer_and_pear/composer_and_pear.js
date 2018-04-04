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

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ComposerAndPear = function () {
    function ComposerAndPear() {
        _classCallCheck(this, ComposerAndPear);

        this.init();
    }

    _createClass(ComposerAndPear, [{
        key: 'init',
        value: function init() {

            if (_yargs.argv._[0] === 'composer' || _yargs.argv._[0] === 'pear' || _yargs.argv._[0] === 'pecl') {

                var project = new _Project2.default();
                var config = project.config[_const.PROJECT_ENV];

                this.installDependencies(config);
                this.executeCommand(config, _yargs.argv._[0], process.argv.slice(3).join(' '));
            }
        }
    }, {
        key: 'checkDependencies',
        value: function checkDependencies() {}
    }, {
        key: 'installDependencies',
        value: function installDependencies(config) {

            var query = void 0;

            // Copio los archivos de configuración al contenedor.
            query = (0, _Tools.execSync)('docker cp "' + _path2.default.join(__dirname, 'server', '.') + '" ' + config.project.domain + ':/etc/composer_and_pear');

            // Ejecuto el archivo de configuración.
            query = (0, _Tools.execSync)('docker exec ' + config.project.domain + ' /bin/sh /etc/composer_and_pear/dependencies.sh');
        }
    }, {
        key: 'executeCommand',
        value: function executeCommand(config, type, args) {
            var _this = this;

            var stdin = process.openStdin();

            var command = void 0;

            if (type === 'composer') {

                command = ['exec', '-i', config.project.domain, '/usr/local/bin/composer', '--working-dir=' + _path2.default.join('/', 'var', 'www', config.project.domain, 'application')].concat(args.split(" "));
            } else {

                command = ['exec', '-i', config.project.domain, type].concat(args.split(" "));
            }

            var query = (0, _child_process.spawn)('docker', command);

            query.stdout.on('data', function (data) {

                process.stdout.write(data);
            });

            query.stderr.on('data', function (err) {

                console.log(err.toString());
            });

            query.on('exit', function (code) {

                // ¿Commit?
                _this.commitSettings(config);

                process.stdin.destroy();
                process.exit();
            });

            stdin.addListener('data', function (data) {

                query.stdin.write(data.toString());
            });
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.docker.template_type === 'django') {

                if (!config.services || _const.FORCE) {
                    // Si no he hecho ningún commit, lo creo para guardar la configuración.

                    var query = (0, _Tools.execSync)('gorilla6 commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"');
                }
            }
        }
    }]);

    return ComposerAndPear;
}();

exports.default = new ComposerAndPear();