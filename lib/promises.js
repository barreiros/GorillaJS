var events = require(__dirname + '/pubsub.js');

var promise;
var promisesValues = [];
var promisesReturn;
var promisesCache = {};

events.subscribe('PROMISEME', function(value){
    if(value && promise){
        if(promise.length > 1){
            promisesCache[promise[2]] = value;
        }
        promisesReturn = value;
    }
    module.exports.start();
});

module.exports = {

    add: function(values){
        if(typeof values === 'object'){
            if(typeof values[0] === 'function'){
                promisesValues.push(values);
            }else{
                promisesValues = promisesValues.concat(values);
            }
        }else{
            promisesValues.push(values);
        }
    },

    cache: function(name){
        return promisesCache[name];
    },

    count: function(){
        return promisesValues.length;
    },

    checkVariables: function(param){
        
        var find, key, out;

        find = param.search('promises::');
        if(find !== -1){
            key = param.substring(find + 'promises::'.length, param.length);
            if(promisesCache.hasOwnProperty(key)){
                out = promisesCache[key];
            }else{
                out = '';
            }
        }else{
            out = param;
        }
        
        return out;
    },

    start: function(){

        if(promisesValues.length > 0){
            promise = promisesValues.shift();
            if(typeof promise === 'function'){
                promisesReturn = promise(promisesReturn);
            }else if(typeof promise === 'string'){
                promisesReturn = run(promise);
            }else if(typeof promise === 'object'){
                if(typeof promise[1] === 'object'){
                    promise[1].forEach(function(param, key){
                        if(typeof param === 'function'){
                            param();
                        }else if(typeof param === 'string'){
                            promise[1][key] = module.exports.checkVariables(param);
                        }
                    });

                    if(promise[1].length !== promise[0]){
                        for(var i = promise[1].length + 1; i < promise[0].length; i++){
                            promise[1].push(null);
                        }
                        promise[1].push(promisesReturn);
                    }
                    promisesReturn = promise[0].apply(this, promise[1]);

                }else{
                    if(typeof promise[1] === 'string'){
                        promise[1] = module.exports.checkVariables(promise[1]);
                    }

                    if(promise[0].length === 1){
                        if(typeof promise[1] === 'undefined'){
                            promisesReturn = promise[0](promisesReturn);
                        }else{
                            promisesReturn = promise[0](promise[1]);
                        }
                    }else if(promise[0].length === 2){
                        if(typeof promise[1] === 'undefined'){
                            promisesReturn = promise[0](promisesReturn);
                        }else{
                            promisesReturn = promise[0](promise[1], promisesReturn);
                        }
                    }else{
                        promisesReturn = promise[0](promisesReturn);
                    }
                }

                if(promise.length > 1){
                    promisesCache[promise[2]] = promisesReturn;
                }
            }

            if(promisesReturn){
                events.publish('PROMISEME');
            }
        }
    }
}
