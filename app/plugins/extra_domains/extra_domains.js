'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../../const.js');

var _Project = require('../../class/Project.js');

var _Project2 = _interopRequireDefault(_Project);

var _Tools = require('../../class/Tools.js');

var _fs = require('fs');

var _Events = require('../../class/Events.js');

var _yargs = require('yargs');

var _jspath = require('jspath');

var _jspath2 = _interopRequireDefault(_jspath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ExtraDomains = function () {
    function ExtraDomains() {
        _classCallCheck(this, ExtraDomains);

        _Events.events.subscribe('AFTER_REPLACE_VALUES', this.addDomains);

        this.init();
    }

    _createClass(ExtraDomains, [{
        key: 'init',
        value: function init() {

            if (_yargs.argv._[0] === 'domain') {

                if (_yargs.argv._[1] === 'extra') {

                    this.saveDomain(_yargs.argv._[2]);
                }
            }
        }
    }, {
        key: 'saveDomain',
        value: function saveDomain(domain) {

            var project = new _Project2.default();
            var config = project.config;

            if (config.hasOwnProperty('alias')) {

                if (!config[_const.PROJECT_ENV].alias.indexOf(domain)) {

                    var alias = config.alias;

                    config[_const.PROJECT_ENV].alias.push(domain);
                }

                console.log('This domain already exists in the project');
            } else {

                config[_const.PROJECT_ENV].alias = [domain];
            }

            project.saveValue(config);

            (0, _Tools.addToHosts)(domain, function () {

                console.log('Please, rebuild the project to install the new domain');
            });
        }
    }, {
        key: 'addDomains',
        value: function addDomains(config, templateTarget, proxyTarget) {

            if (config.hasOwnProperty('alias')) {

                var file = (0, _fs.readFileSync)(proxyTarget + '/apache-proxy.conf').toString();

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = config.alias[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var domain = _step.value;


                        var position = file.indexOf('ServerAlias');

                        file = [file.slice(0, position), 'ServerAlias ' + domain + '\r\n\t', file.slice(position)].join('');
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                (0, _fs.writeFileSync)(proxyTarget + '/apache-proxy.conf', file);
            }
        }
    }]);

    return ExtraDomains;
}();

exports.default = new ExtraDomains();