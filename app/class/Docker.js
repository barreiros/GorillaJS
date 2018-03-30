'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Docker = function () {
    function Docker() {
        _classCallCheck(this, Docker);
    }

    _createClass(Docker, [{
        key: 'check',
        value: function check() {

            var query = void 0;

            // Compruebo si docker está instalado y funcionando.
            query = (0, _child_process.spawnSync)('docker', ['ps']);

            if (query.error || query.stderr.toString()) {

                // Debug query.error

                return false;
            }

            // Compruebo si docker está instalado y funcionando.
            query = (0, _child_process.spawnSync)('docker-compose', ['-v']);

            if (query.error || query.stderr.toString()) {

                // Debug query.error

                return false;
            }

            return true;
        }
    }, {
        key: 'start',
        value: function start(composeFile, slug) {
            var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


            var command = void 0;

            if (force) {

                command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d';
            } else {

                command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up -d';
            }

            try {

                (0, _child_process.execSync)(command);
            } catch (err) {

                // Debug err.stderr.toString()

                console.log(err.stderr.toString());
            }
        }
    }, {
        key: 'stop',
        value: function stop(composeFile, slug) {

            var command = void 0;

            command = 'docker-compose -p "' + slug + '" rm -f -s -v';

            try {

                (0, _child_process.execSync)(command, {
                    cwd: _path2.default.dirname(composeFile)
                });
            } catch (err) {

                // Debug err.stderr.toString()

                console.log(err.stderr.toString());
            }
        }

        // network: function(){
        //
        //     var container; 
        //
        //     cross.exec('docker network ls --format="{{.Name}}"', function(err, stdout, stderr){
        //
        //         if (err) events.publish('ERROR', ['035']);
        //
        //         containers = getContainersName(stdout);
        //
        //         if(containers.indexOf('gorillajs') === -1){
        //
        //             cross.exec('docker network create --driver bridge gorillajs', function(err, stdout, stderr){
        //
        //                 events.publish('VERBOSE', [stderr + err + stdout]);
        //                 events.publish('PROMISEME');
        //
        //             });
        //
        //         }else{
        //
        //             events.publish('PROMISEME');
        //
        //         }
        //
        //     });
        //
        // }

    }]);

    return Docker;
}();

exports.default = Docker;