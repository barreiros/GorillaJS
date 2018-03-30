'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Events = function () {
    function Events() {
        _classCallCheck(this, Events);

        this.cache = {};
    }

    _createClass(Events, [{
        key: 'publish',
        value: function publish(topic, args, scope) {

            if (this.cache[topic]) {

                var thisTopic = this.cache[topic],
                    i = thisTopic.length - 1;

                for (i; i >= 0; i -= 1) {

                    if ((typeof args === 'undefined' ? 'undefined' : _typeof(args)) === 'object') {

                        thisTopic[i].apply(scope || this, args || []);
                    } else {

                        thisTopic[i](args);
                    }
                }
            }
        }
    }, {
        key: 'subscribe',
        value: function subscribe(topic, callback) {

            if (!this.cache[topic]) {

                this.cache[topic] = [];
            }

            this.cache[topic].push(callback);

            return [topic, callback];
        }
    }, {
        key: 'unsubscribe',
        value: function unsubscribe(handle, completly) {

            var t = handle;
            var i = void 0;

            if (this.cache[t]) {

                i = this.cache[t].length - 1;
            } else {

                i = 0;
            }

            if (this.cache[t]) {

                for (i; i >= 0; i -= 1) {

                    if (this.cache[t][i] === completly) {

                        this.cache[t].splice(i, 1);

                        if (completly) {

                            delete this.cache[t];
                        }
                    }
                }
            }
        }
    }]);

    return Events;
}();

var events = exports.events = new Events();