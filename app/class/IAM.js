'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _License = require('./License.js');

var _License2 = _interopRequireDefault(_License);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IAM = function () {
    function IAM() {
        _classCallCheck(this, IAM);
    }

    _createClass(IAM, [{
        key: 'credentials',
        value: function credentials() {

            // Recupero la licencia
            var license = new _License2.default();
            console.log(license.license);

            // Hago una llamada a GorillaJS para conseguir las claves de Amazon que me permitirán acceder a los recursos del usuario de manera temporal.
            // request...

            // Si la llamada devuelve error, se lo muestro al usuario y delego en quien haya hecho la llamada parar o no el programa.
        }
    }]);

    return IAM;
}();

exports.default = IAM;