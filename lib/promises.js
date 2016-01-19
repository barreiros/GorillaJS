var events = require(__dirname + '/pubsub.js');

var promisesValues = [];
var promisesReturn;
var promisesCache = {};

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
        console.log(promisesCache[name]);
        return promisesCache[name];
    },

    count: function(){
        return promisesValues.length;
    },

    start: function(){

        var promise;

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
                        }
                    });

                    if(promise[1].length !== promise[0]){
                        for(var i = promise[1].length + 1; i < promise[0].length; i++){
                            promise[1].push(null);
                        }
                        promise[1].push(promisesReturn);
                    }
                    promisesReturn = promise[0].apply(this, promise[1]);

                    if(promise.length > 1){
                        promisesCache[promise[2]] = promisesReturn;
                    }
                }else{
                    promisesReturn = promise[0](promise[1], promisesReturn);
                }
            }

            if(promisesReturn){
                events.publish('PROMISEME');
            }
        }
    }
}
