'use strict';

var cache = {};

module.exports = {

    publish: function(topic, args, scope) {

        if (cache[topic]) {
            var thisTopic = cache[topic],
                i = thisTopic.length - 1;

            for (i; i >= 0; i -= 1) {
                if(typeof args === 'object'){
                    thisTopic[i].apply( scope || this, args || []);
                }else{
                    thisTopic[i](args);
                }
            }
        }
    },
    subscribe: function(topic, callback) {

        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback];
    },
    unsubscribe: function(handle, completly) {

        // var t = handle[0],
        var t = handle;
        var i;

        if(cache[t]){

            i = cache[t].length - 1;

        }else{

            i = 0;

        }

        if (cache[t]) {
            for (i; i >= 0; i -= 1) {
                // if (cache[t][i] === handle[1]) {
                if (cache[t][i] === completly) {
                    cache[t].splice(i, 1);
                    if(completly){ delete cache[t]; }
                }
            }
        }
    }
}
