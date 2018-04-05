'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _yargs = require('yargs');

var _pty = require('pty.js');

var _pty2 = _interopRequireDefault(_pty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DjangoManager = function () {
    function DjangoManager() {
        _classCallCheck(this, DjangoManager);

        this.init();
    }

    _createClass(DjangoManager, [{
        key: 'init',
        value: function init() {

            if (_yargs.argv._[0] === 'django' || _yargs.argv._[0] === 'manage.py' || _yargs.argv._[0] === 'pip') {

                var project = new _Project2.default();
                var config = project.config[_const.PROJECT_ENV];

                this.executeCommand(config.project.domain, _yargs.argv._[0], process.argv.slice(3).join(' '));
            }
        }
    }, {
        key: 'executeCommand',
        value: function executeCommand(container, type, args) {

            var stdin = process.openStdin();

            var command = void 0;

            if (type === 'django' || type === 'manage.py') {

                command = ['exec', '-it', container, 'python3', '/var/www/' + container + '/manage.py', args];
            } else {

                command = ['exec', '-it', container, 'pip3'].concat(args.split(" "));
            }

            var term = _pty2.default.spawn('docker', command, {
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
        }
    }]);

    return DjangoManager;
}();

exports.default = new DjangoManager();