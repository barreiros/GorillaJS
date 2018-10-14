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

var SSL = function () {
    function SSL() {
        _classCallCheck(this, SSL);

        _Events.events.subscribe('BEFORE_REPLACE_VALUES', this.copySSLFiles);
        _Events.events.subscribe('BEFORE_REPLACE_VALUES', this.copySSLAppFiles);
        _Events.events.subscribe('AFTER_REPLACE_VALUES', this.addSSL);
        _Events.events.subscribe('PROJECT_BUILT', this.configureProxy);
        _Events.events.subscribe('PROJECT_BUILT', this.configureApp);
        _Events.events.subscribe('PROJECT_BUILT', this.commitSettings);
    }

    _createClass(SSL, [{
        key: 'copySSLAppFiles',
        value: function copySSLAppFiles(config, templateTarget) {

            if (config.ssl.enable === 'yes') {

                (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'app.sh'), _path2.default.join(templateTarget, 'ssl.sh'));
            }
        }
    }, {
        key: 'copySSLFiles',
        value: function copySSLFiles(config, templateTarget, proxyTarget) {

            if (config.ssl.enable === 'yes') {

                (0, _fsExtra.copySync)(_path2.default.join(__dirname, 'server'), proxyTarget);
            }
        }
    }, {
        key: 'addSSL',
        value: function addSSL(config, templateTarget, proxyTarget) {

            if (config.ssl.enable === 'yes') {

                var file = _yamljs2.default.load(_path2.default.join(proxyTarget, 'docker-compose.yml'));

                file.services.proxy.ports.push(_const.PROJECT_SSL_PORT + ':' + _const.PROJECT_SSL_PORT);
                file.services.proxy.volumes.push(config.proxy.userpath + '/letsencrypt:/etc/letsencrypt');

                (0, _fs.writeFileSync)(_path2.default.join(proxyTarget, 'docker-compose.yml'), _yamljs2.default.stringify(file, 6));
            }
        }
    }, {
        key: 'configureProxy',
        value: function configureProxy(config) {

            if (config.ssl.enable === 'yes') {

                var query = (0, _Tools.execSync)('docker exec gorillajsproxy /bin/sh /root/templates/ssl.sh');
            }
        }
    }, {
        key: 'configureApp',
        value: function configureApp(config) {

            if (config.ssl.enable === 'yes') {

                var query = (0, _Tools.execSync)('docker exec ' + config.project.domain + ' /bin/sh /root/templates/ssl.sh');
            }
        }
    }, {
        key: 'commitSettings',
        value: function commitSettings(config) {

            // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
            if (config.docker.template_type === 'yes') {

                if (!config.services || _const.FORCE) {// Si no he hecho ningún commit, lo creo para guardar la configuración.

                    // let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

                }
            }
        }
    }]);

    return SSL;
}();

exports.default = new SSL();