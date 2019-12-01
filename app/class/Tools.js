'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.execSync = exports.checkHost = exports.addToHosts = undefined;

var _const = require('../const.js');

var _fs = require('fs');

var _inquirer = require('inquirer');

var _child_process = require('child_process');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var addToHosts = exports.addToHosts = function addToHosts(domain, callback) {

    var file = (0, _fs.readFileSync)(_const.SYSTEM_HOSTS_FILE).toString();
    var text = '127.0.0.1 ' + domain + ' #GorillaJS';

    if (file.search(text) === -1) {

        if (process.platform === 'win32') {

            var query = void 0;

            query = execSync('ECHO ' + text + ' >> ' + _const.SYSTEM_HOSTS_FILE);

            // Añado el registro también con www en una llamada diferente para no tener problemas con el retorno de carro.
            text = '127.0.0.1 www.' + domain + ' #GorillaJS';
            query = execSync('ECHO ' + text + ' >> ' + _const.SYSTEM_HOSTS_FILE);
        } else {

            // Añado el registro también con www en la misma llamada.
            text += '\n127.0.0.1 www.' + domain + ' #GorillaJS';

            var options = {
                type: 'password',
                name: 'result',
                message: 'Admin system password'
            };

            var attempt = function attempt() {

                (0, _inquirer.prompt)([options]).then(function (answer) {

                    var query = void 0;

                    query = execSync('echo "' + answer.result + '" | sudo -S sh -c "echo \'' + text + '\' >> ' + _const.SYSTEM_HOSTS_FILE + '"');

                    if (query.err) {

                        query = execSync('echo "' + answer.result + '" | su -s /bin/sh -c "echo \'' + text + '\' >> ' + _const.SYSTEM_HOSTS_FILE + '"');
                    }

                    if (query.err) {

                        // Error query.err

                        console.log(query);
                        attempt();
                    } else {

                        if (callback) callback();
                    }
                });
            };

            attempt();
        }
    } else {

        if (callback) callback();
    }
};

var checkHost = exports.checkHost = function checkHost(url, callback) {

    var attempts = 0;

    var attempt = function attempt() {

        (0, _request2.default)(url, function (error, response, body) {

            if (!response || response.statusCode !== 200) {

                attempts += 1;

                if (attempts < 100) {

                    setTimeout(function () {

                        attempt();
                    }, 2000);
                } else {

                    console.log('Demasiados intentos');

                    // Error demasiados intentos de conexión.
                }
            } else {

                callback();
            }
        });
    };

    attempt();
};

var execSync = exports.execSync = function execSync(query) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


    var output = void 0;

    try {

        var response = (0, _child_process.execSync)(query, options);

        output = {

            stdout: response.toString(),
            stderr: false,
            err: false

        };
    } catch (err) {

        output = {

            stdout: err.stdout ? err.stdout.toString() : '',
            stderr: err.stderr ? err.stderr.toString() : '',
            err: err.stderr ? err.stderr.toString() : ''

        };
    }

    if (_const.DEBUG) {

        console.log(output);
    }

    return output;
};