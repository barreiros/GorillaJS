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
    start();
});

module.exports = {
    add: add,
    count: count,
    checkVariables: checkVariables,
    start: start,
    cond: cond
}

function add(values){
    if(typeof values === 'object'){
        if(typeof values[0] === 'function'){
            promisesValues.push(values);
        }else{
            promisesValues = promisesValues.concat(values);
        }
    }else{
        promisesValues.push(values);
    }
}

function cache (name){
    return promisesCache[name];
}

function count(){
    return promisesValues.length;
}

function checkVariables(param){

    var find, key, arr;

    find = param.search('::');

    if(find !== -1){
        arr = param.split('::');
        arr.forEach(function(value, key){
            if(key % 2){
                if(typeof promisesCache[value] === 'string' || typeof promisesCache[value] === 'number'){
                    param = param.replace('::' + value + '::', promisesCache[value]);
                }else{
                    param = promisesCache[value];
                }
            }
        });
    }else{
        out = param;
    }

    return param;
}

function start(){

    if(promisesValues.length > 0){
        promise = promisesValues.shift();
        if(typeof promise === 'function'){
            promisesReturn = promise(promisesReturn);
        }else if(typeof promise === 'string'){
            promisesReturn = run(promise);
        }else if(typeof promise === 'object'){
            if(typeof promise[1] === 'object' && promise[1] !== null){
                if(promise[0].name === 'cond' && promise[0].length === 2){
                    if(promise.length === 3){
                        promise[0](promise[1], promise[2]); 
                    }else{
                        promise[0](promise[1], promisesReturn); 
                    }
                }else{
                    promise[1].forEach(function(param, key){
                        if(typeof param === 'string'){
                            promise[1][key] = checkVariables(param);
                        }
                    });

                    if(promise[1].length !== promise[0]){
                        for(var i = promise[1].length + 1; i < promise[0].length; i++){
                            promise[1].push(null);
                        }
                        promise[1].push(promisesReturn);
                    }
                    promisesReturn = promise[0].apply(this, promise[1]);
                }

            }else{
                if(typeof promise[1] === 'string'){
                    promise[1] = checkVariables(promise[1]);
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

function cond(list, value){

    // value puede ser boolean, number, string, promises variable, function, promises function.
    if(typeof value === 'string'){
        value = checkVariables(value);
    }else if(typeof value === 'function'){
        value = value();
    }else if(typeof value === 'object' && value !== null){
        if(typeof value[1] === 'object'){
            value[1].forEach(function(param, key){
                if(typeof param === 'string'){
                    promise[1][key] = checkVariables(param);
                }
            });

            value = value[0].apply(this, value[1]);
        }else{
            value = value[0](value[1]);
        }
    }

    if(value === true){
        if(typeof list === 'object'){
            if(typeof list[0] === 'object'){
                // Es un array de arrays.
                for(var i = list.length - 1; i >= 0; i--){
                    promisesValues.unshift(list[i]);
                }
            }else{
                promisesValues.unshift(list);
                // Solo hay una función.
            }
        }else{
            // No es un array, puede ser una función directa, un objeto de gulp... Lo añado al flujo y me desentiendo.
            promisesValues.unshift(list);
        }
    }

    events.publish('PROMISEME');
}
