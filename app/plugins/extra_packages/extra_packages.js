'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _yargs = require('yargs');

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ExtraPackages = function () {
        function ExtraPackages() {
                _classCallCheck(this, ExtraPackages);

                if (process.platform !== 'win32') {

                        this.init();
                }
        }

        _createClass(ExtraPackages, [{
                key: 'init',
                value: function init() {

                        if (_yargs.argv._[0] === 'apk' || _yargs.argv._[0].search('apt') !== -1 || _yargs.argv._[0] === 'pacman' || _yargs.argv._[0] === 'rpm' || _yargs.argv._[0] === 'yum') {

                                var project = new _Project2.default();
                                var config = project.config[_const.PROJECT_ENV];
                                var container = void 0;

                                if (_yargs.argv.c) {

                                        container = _yargs.argv.c;
                                } else {

                                        container = config.project.domain;
                                }

                                this.executeCommand(container, _yargs.argv._[0], process.argv.slice(3).join(' '));
                        }
                }
        }, {
                key: 'executeCommand',
                value: function executeCommand(container, type, args) {

                        var pty = require('pty.js');
                        var stdin = process.openStdin();
                        var command = ['exec', '-i', container, type].concat(args.split(" "));
                        var query = (0, _child_process.spawn)('docker', command);

                        query.stdout.on('data', function (data) {

                                process.stdout.write(data);
                        });

                        query.stderr.on('data', function (err) {

                                console.log(err.toString());
                        });

                        query.on('exit', function (code) {

                                process.stdin.destroy();
                                process.exit();
                        });

                        stdin.addListener('data', function (data) {

                                query.stdin.write(data.toString());
                        });
                }
        }]);

        return ExtraPackages;
}();

exports.default = new ExtraPackages();