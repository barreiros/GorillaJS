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

        // events.subscribe('TUNNEL_SEND_MESSAGE', function(id, message){
        //     
        //     io.sockets.in(id).emit('message', message)
        //
        // })
    }

    _createClass(SocketGuest, [{
        key: 'socketConnected',
        value: function socketConnected(client) {

            client.on('logging', function (id) {});

            client.on('project', function (id) {

                var roomProcess = void 0,
                    commandArgs = void 0,
                    commandProcess = void 0;

                console.log('Se ha conectado el proyecto', id);

                client.join(id);

                client.on('message', function (message) {

                    if (!roomProcess) {

                        console.log('Inicio el proceso', id);

                        commandArgs = message.split(' ');
                        commandProcess = commandArgs.shift();

                        roomProcess = child.spawn(commandProcess, commandArgs, {

                            // cwd: path.join(process.cwd(), id)

                        });

                        roomProcess.stdout.on('data', function (message) {

                            client.emit('message', message.toString());
                        });

                        roomProcess.stderr.on('data', function (error) {

                            client.emit('error', error.toString());
                        });

                        roomProcess.on('exit', function () {

                            client.emit('terminated');

                            roomProcess.kill();
                            roomProcess = null;
                        });
                    }

                    roomProcess.stdin.write(message + '\n');
                });

                client.on('disconnect', function () {

                    console.log('Se ha desconectado el proyecto', id);

                    // events.publish('TUNNEL_TERMINATE', [id])
                });

                client.on('error', function (error) {

                    console.log('Error en el proyecto', id, error.toString());

                    // events.publish('TUNNEL_ERROR', [id, error.toString()])
                });
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