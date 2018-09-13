'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _Events = require('../../class/Events.js');

var _Tools = require('../../class/Tools.js');

var _fsExtra = require('fs-extra');

var _fs = require('fs');

var _yargs = require('yargs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Varnish = function () {
    function Varnish() {
        _classCallCheck(this, Varnish);

        _Events.events.subscribe('BEFORE_REPLACE_VALUES', this.copyTemplate);
        _Events.events.subscribe('AFTER_REPLACE_VALUES', this.configureEngine);
        _Events.events.subscribe('PROJECT_BUILT', this.commitSettings);

        this.init();
    }

    _createClass(Varnish, [{
        key: 'init',
        value: function init() {

            if (_yargs.argv._[0] === 'varnish') {

                var project = new _Project2.default();
                var config = project.config[_const.PROJECT_ENV];

                if (_yargs.argv._[1] === 'reload') {

                    this.reloadConfig(config);
                } else if (_yargs.argv._[1] === 'admin') {

                    this.executeCommand(config.project.domain + '_varnish', 'varnishadm');
                }
            }
        }
    }, {
        key: 'copyTemplate',
        value: function copyTemplate(config, templateTarget, proxyTarget) {

            // Si Varnish está activado...
            if (config.varnish.enable === 'yes') {

                // Copio los archivos de la plantilla de varnish.
                (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'entrypoint-varnish.sh'), _path2.default.join(templateTarget, 'entrypoint-varnish.sh'));
                (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'docker-compose-varnish.yml'), _path2.default.join(templateTarget, 'docker-compose-varnish.yml'));

                // Cambio la configuración del virtualhost en el proxy para que apunte al contenedor de Varnish en lugar de al front del proyecto.
                var proxyFile = void 0;

                if ((0, _fs.existsSync)(_path2.default.join(proxyTarget, 'apache-proxy.conf'))) {

                    proxyFile = (0, _fs.readFileSync)(_path2.default.join(proxyTarget, 'apache-proxy.conf'), 'utf8');
                    proxyFile = proxyFile.replace(/ProxyPass \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPass \/ http:\/\/\{\{project.domain\}\}_varnish\/');
                    proxyFile = proxyFile.replace(/ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}_varnish\/');
                    (0, _fs.writeFileSync)(_path2.default.join(proxyTarget, 'apache-proxy.conf'), proxyFile);
                }

                if ((0, _fs.existsSync)(_path2.default.join(proxyTarget, 'apache-proxy-ssl.conf'))) {

                    proxyFile = (0, _fs.readFileSync)(_path2.default.join(proxyTarget, 'apache-proxy-ssl.conf'), 'utf8');
                    proxyFile = proxyFile.replace(/ProxyPass \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPass \/ http:\/\/\{\{project.domain\}\}_varnish\/');
                    proxyFile = proxyFile.replace(/ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}_varnish\/');
                    (0, _fs.writeFileSync)(_path2.default.join(proxyTarget, 'apache-proxy-ssl.conf'), proxyFile);
                }
            }
        }
    }, {
        key: 'configureEngine',
        value: function configureEngine(config, templateTarget) {

            if (config.varnish.enable === 'yes') {

                var file = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose.yml'));

                var varnishFile = _yamljs2.default.load(_path2.default.join(templateTarget, 'docker-compose-varnish.yml'));

                file.services['varnish'] = varnishFile.services.varnish;
                (0, _fs.writeFileSync)(_path2.default.join(templateTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
            }
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.varnish.enable === 'yes') {

                if (!config.services || _const.FORCE) {
                    // Si no he hecho ningún commit, lo creo para guardar la configuración.

                    var query = (0, _Tools.execSync)('gorilla6 commit "' + config.project.domain + '" --path "' + _const.PROJECT_PATH + '"');
                }
            }
        }
    }, {
        key: 'reloadConfig',
        value: function reloadConfig(config) {

            if (config.varnish.enable === 'yes') {

                var rand = Math.floor(Math.random() * (1000 - 0 + 1) + 0);

                var query = (0, _Tools.execSync)('docker exec ' + config.project.domain + '_varnish varnishadm vcl.load reload_' + rand + ' /etc/varnish/default.vcl');

                if (!query.err) {

                    query = (0, _Tools.execSync)('docker exec ' + config.project.domain + '_varnish varnishadm vcl.use reload_' + rand);

                    console.log('Varnish caché reloaded!');
                } else {

                    console.log(query);
                }
            }
        }
    }, {
        key: 'executeCommand',
        value: function executeCommand(container, type, args) {

            if (process.platform !== 'win32') {

                var pty = require('pty.js');
                var stdin = process.openStdin();
                var command = void 0;

                if (type === 'varnishadm') {

                    command = ['exec', '-it', container, type];
                } else {

                    command = ['exec', '-it', container, type].concat(args.split(" "));
                }

                var term = pty.spawn('docker', command, {
                    name: 'xterm-color',
                    cols: 80,
                    rows: 30,
                    cwd: process.env.HOME,
                    env: process.env
                });

                term.on('data', function (data) {

                    process.stdout.write(data);
                });

                term.on('close', function (code) {

                    process.exit();
                    process.stdin.destroy();
                });

                stdin.addListener('data', function (data) {

                    term.write(data.toString());
                });
            } else {

                // Si es Windows le muestro al usuario el comando que debe ejecutar porque no funciona el pseudo terminal.
                console.log('Sorry, but GorillaJS can\'t execute interactive commands in Windows automatically :-( Please, if your command need\'s to be interactive paste and run the command below in your terminal.');
                console.log('docker exec -it ' + container + ' ' + type + ' ' + args.split(" "));

                var query = (0, _Tools.execSync)('docker exec ' + container + ' ' + type + ' ' + args.split(" "));

                console.log(query.stdout);

                process.exit();
            }
        }
    }]);

    return Varnish;
}();

exports.default = new Varnish();