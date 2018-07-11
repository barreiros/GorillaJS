'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _child_process = require('child_process');

var child = _interopRequireWildcard(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SocketGuest = function () {
        function SocketGuest() {
                _classCallCheck(this, SocketGuest);

                var app = void 0,
                    io = void 0;

                app = _http2.default.createServer();

                app.listen(_const.SOCKET_PORT);

                io = (0, _socket2.default)(app);

                io.on('connection', this.socketConnected);

                io.on('error', this.socketError);
        }

        _createClass(SocketGuest, [{
                key: 'socketConnected',
                value: function socketConnected(client) {

                        console.log('Se conecta un nuevo cliente');

                        var query = void 0;

                        client.on('command', function (params) {

                                if (params.type === 'persistent') {

                                        var commandArgs = void 0,
                                            commandProcess = void 0;

                                        commandArgs = params.command.split(' ');
                                        commandProcess = commandArgs.shift();

                                        query = child.spawn(commandProcess, commandArgs);

                                        query.stdout.on('data', function (message) {

                                                client.emit('message', { type: 'data', 'message': message.toString() });
                                        });

                                        query.stderr.on('data', function (error) {

                                                client.emit('message', { type: 'error', 'message': error.toString() });
                                        });

                                        query.on('exit', function () {

                                                client.emit('message', { type: 'exit', 'message': '' });

                                                query.kill();
                                                query = null;
                                        });
                                } else {

                                        child.exec(params.command, function (err, stdout, stderr) {

                                                if (err) {

                                                        client.emit('message', { type: 'error', message: stderr.toString() });
                                                } else {

                                                        client.emit('message', { type: 'ok', message: stdout.toString() });
                                                }
                                        });
                                }
                        });

                        client.on('message', function (message) {

                                query.stdin.write(message + '\n');
                        });

                        client.on('disconnect', function () {

                                console.log('Se ha desconectado el proyecto', id);
                        });

                        client.on('error', function (error) {

                                console.log('Error en el proyecto', id, error.toString());
                        });
                }
        }, {
                key: 'socketError',
                value: function socketError(error) {

                        console.log(erro);
                }
        }]);

        return SocketGuest;
}();

exports.default = SocketGuest;