var path = require('path');
var run = require('run-sequence');
var escapeRegExp = require('escape-string-regexp');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');

var promises = [];
var config;

module.exports = function (env){

    var module = {};

    module.promises = function(){
        return promises;
    };

    module.moveFiles = function(moveFrom, moveTo, exclude){

        fs.readdir(moveFrom, function(err, files){
            if(err){
                console.error("Could not list the directory.", err);
            } 

            files.forEach(function(file, index){
                var fromPath = path.join(moveFrom, file);
                var toPath = path.join(moveTo, file);
                var regExp;

                if(exclude){
                    regExp = new RegExp('^((?!/' + exclude.map(escapeRegExp).join('|') + ').)*$');
                }else{
                    regExp = new RegExp('');
                }

                if(regExp.test(fromPath)){
                    fs.stat(fromPath, function(error, stat){
                        if(error){
                            return;
                        }

                        fs.rename( fromPath, toPath, function(error){
                            if(error){
                                // console.error("File moving error.", error);
                            }else {
                                console.log("Moved file '%s' to '%s'.", fromPath, toPath);
                            }
                        });
                    });
                }
            });
        });
    };

    module.removeDir = function(path){

        exec('rm -r ' + path, function(err, stdout, stderr){

        });
    };

    module.setConfigFile = function(path){
        config = require(path);
        configFile = path;
    };

    module.setEnvVariables = function(paths){
    
        var valuesToReplace, tempenv, group, key, value;

        valuesToReplace = [];

        for(tempenv in config){
            if(tempenv !== env){
                for(group in config[tempenv]){
                    if(typeof config[tempenv][group] === 'object'){
                        for(key in config[tempenv][group]){
                            if(config[env][group][key] !== ''){
                                value = [config[tempenv][group][key], config[env][group][key]];
                                valuesToReplace.push(value);
                            }
                        }
                    }else{
                        if(config[env][group] !== ''){
                            value = [config[tempenv][group], config[env][group]];
                            valuesToReplace.push(value);
                        }
                    }
                }
            }
        }

        for(group in config[env]){
            if(typeof config[env][group] === 'object'){
                for(key in config[env][group]){
                    if(config[env][group][key] !== ''){
                        value = ['${' + group + '.' + key + '}', config[env][group][key]];
                        valuesToReplace.push(value);
                    }
                }
            }else{
                if(config[env][group] !== ''){
                    value = ['${' + group + '}', config[env][group]];
                    valuesToReplace.push(value);
                }
            }
        }

        gulp.src(paths)
            .pipe(replace(valuesToReplace))
            .pipe(gulp.dest(function(data){
                return data.base;
            }))
        .on('finish', function(){
            events.publish('PROMISEME');
        });
    };

    module.resetEnvVariables = function(paths){

        var valuesToReplace, group, key, value;

        valuesToReplace = [];

        for(group in config[env]){
            if(typeof config[env][group] === 'object'){
                for(key in config[env][group]){
                    if(config[env][group][key] !== ''){
                        value = [config[env][group][key], '${' + group + '.' + key + '}'];
                            valuesToReplace.push(value);
                        }
                    }
                }else{
                    if(config[env][group] !== ''){
                        value = [config[env][group], '${' + group + '}'];
                            valuesToReplace.push(value);
                        }
                    }
                }

        gulp.src(paths)
            .pipe(replace(valuesToReplace))
            .pipe(gulp.dest(function(data){
                return data.base;
            }))
            .on('finish', function(){
                events.publish('PROMISEME');
            })
    };

    module.param = function(step, name){

        var value;

        if(config[env][step][name].length > 0){
            value = config[env][step][name];
        }else{
            if(name.indexOf('pass') > -1){
                value = prompt.question('Value for ' + name + ': ', {hideEchoBack: true});
            }else{
                value = prompt.question('Value for ' + name + ': ', {});
            }
        }
        config[env][step][name] = value;
        fs.writeFile(configFile, JSON.stringify(config, null, '\t'));

        return value;
    };

    module.envFilter = function(allowed){

        if(allowed.indexOf(env) === -1){
            console.log('');
            console.log('**************************************************************'.bold.red);
            console.log('');
            console.log(' At least one task is not allowed in the current environment '.bold.red);
            console.log('');
            console.log('**************************************************************'.bold.red);
            console.log('');
            process.exit();
        }
    };
    
    module.promiseme = function(){

        var promise;

        if(promises.length > 0){
            promise = promises.shift();
            if(typeof promise === 'function'){
                promise();
            }else if(typeof promise === 'string'){
                run(promise);
            }else if(typeof promise === 'object'){
                promise[0](promise[1]);
            }
        }
    };

    return module;
}
