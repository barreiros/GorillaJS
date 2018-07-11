'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});
exports.license = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('../const.js');

var _fs = require('fs');

var _fsExtra = require('fs-extra');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var License = function () {
        function License() {
                _classCallCheck(this, License);

                this.licenseType = 'BASIC';
        }

        _createClass(License, [{
                key: 'check',
                value: function check(callback) {

                        // Recupero el archivo de licencia.
                        var license = this.license;

                        // En este punto hago unas comprobaciones básicas de formato. Sin más.
                        if (license.length > 20) {

                                this.licenseType = 'PRO';
                        }

                        callback(this.licenseType);
                }
        }, {
                key: 'add',
                value: function add(license) {

                        // Guardo la licencia en el archivo de licencia.
                        (0, _fs.writeFileSync)(_const.LICENSE_PATH, license);
                }
        }, {
                key: 'type',
                get: function get() {

                        return this.licenseType;
                }
        }, {
                key: 'license',
                get: function get() {

                        var license = void 0;

                        if ((0, _fsExtra.pathExistsSync)(_const.LICENSE_PATH)) {

                                license = (0, _fs.readFileSync)(_const.LICENSE_PATH, 'utf8');
                        } else {

                                license = '';
                        }

                        return license;
                }
        }]);

        return License;
}();

var license = exports.license = new License();