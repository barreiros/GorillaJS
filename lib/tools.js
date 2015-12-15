var path = require('path');
var run = require('run-sequence');
var escapeRegExp = require('escape-string-regexp');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');
var prompt = require('readline-sync');

var promises = [];
var config = {};
var errors;
var gorillaFile;
var messages = JSON.parse(fs.readFileSync(__dirname + '/../messages.json'));

module.exports = function (env){

    var module = {};

    module.promises = function(){
        return promises;
    };

    module.createBaseEnvironment = function(projectPath, gorilla, gorillaFolder){
        events.publish('STEP', ['tools-createbase']);

        gorillaFile = projectPath + '/' + gorilla;

        if(!fs.existsSync(gorillaFile)){
            fsx.ensureFileSync(gorillaFile);
            config['default'] = {};
            writeConfigFile();
        }else{
            config = JSON.parse(fs.readFileSync(gorillaFile).toString());
        }

        if(!fs.existsSync(gorillaFolder)){
            fs.mkdirSync(gorillaFolder);
        }
    };

    module.createDockerEnvironment = function(projectPath, templatesPath, gorilla, gorillaFolder){

        var template;

        gorillaFile = projectPath + '/' + gorilla;

        if(!fs.existsSync(gorillaFile)){
            module.param('docker', 'template');
            template = config[env].docker.template;
             
            fsx.copySync(
                templatesPath + '/' + template + '/' + gorilla,
                gorillaFile
            );

            config = JSON.parse(fs.readFileSync(gorillaFile).toString());
            config[env].docker.template = template;
            config[env].apache.port = Math.floor(Math.random() * (4999 - 4700)) + 4700;
            module.param('docker', 'template');
        }else{
            config = JSON.parse(fs.readFileSync(gorillaFile).toString());
        }

    };

    // module.moveFiles = function(moveFrom, moveTo, exclude){
    module.moveFiles = function(args){

        var files, stats, fromPath, toPath, regExp;

        files = fs.readdirSync(args[0]);
        files.forEach(function(file, index){
            fromPath = path.join(args[0], file);
            toPath = path.join(args[1], file);

            if(args[2]){
                regExp = new RegExp('^((?!/' + args[2].map(escapeRegExp).join('|') + ').)*$');
            }else{
                regExp = new RegExp('');
            }

            if(regExp.test(fromPath)){

                stats = fs.existsSync(fromPath);

                if(stats){
                    stats = fsx.copySync(fromPath, toPath);
                }

                // fs.rename( fromPath, toPath, function(error){
                //     console.log('Hey, Bar');
                //     if(error){
                //         console.error("File moving error.", error);
                //     }else {
                //         console.log("Moved file '%s' to '%s'.", fromPath, toPath);
                //     }
                // });
            }
        });

        events.publish('PROMISEME');
    };

    module.removeDir = function(path){

        exec('rm -r ' + path, function(err, stdout, stderr){

        });
    };

    module.setEnvVariables = function(paths){

        var valuesToReplace, tempenv, group, key, value;

        valuesToReplace = [];

        for(tempenv in config){
            for(group in config[tempenv]){
                if(typeof config[tempenv][group] === 'object'){
                    for(key in config[tempenv][group]){
                        if(config[env][group][key] !== ''){
                            value = [config[tempenv][group][key], config[env][group][key]];
                            valuesToReplace.push(value);
                        }else{
                            module.param(group, key);
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

    module.param = function(step, name, options){

        var value, stats, exist, key;
        
        if(!config.hasOwnProperty(env)){
            config[env] = {};
        }

        if(!config[env].hasOwnProperty(step)){
            config[env][step] = {};
        }

        exist = false;
        if(config[env][step].hasOwnProperty(name)){
            if(config[env][step][name] !== ''){
                exist = true;
            }
        }

        if(exist){
            value = config[env][step][name];
        }else{
            if(options){
                key = prompt.keyInSelect(options, 'Value for the ' + step + ' ' + name + ': ', {cancel: false, guide: false});
                console.log(key);
                if(options[key].toLowerCase() === 'other'){
                    value = prompt.question('Your value for the ' + step + ' ' + name + ': ', {});
                }else{
                    value = options[key];
                }
            }else{
                if(name.indexOf('pass') > -1){
                    value = prompt.question('Value for the ' + step + ' ' + name + ': ', {hideEchoBack: true});
                }else{
                    value = prompt.question('Value for the ' + step + ' ' + name + ': ', {});
                }
            }
        }
        config[env][step][name] = value;

        writeConfigFile();

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

    module.showError = function(error){
        if(messages.errors.hasOwnProperty(error)){
            console.log('[GorillaJS]'.bold.grey + '[Error]'.bold.red, messages.errors[error]);
        }
    };

    module.showWarning = function(warning){
        if(messages.warnings.hasOwnProperty(warning)){
            console.log('[GorillaJS]'.bold.grey + '[Warning]'.bold.yellow, messages.warnings[warning]);
        }
    };

    module.showStep = function(step){
        if(messages.steps.hasOwnProperty(step)){
            console.log('[GorillaJS]'.bold.grey + '[Step]'.bold, messages.steps[step]);
        }
    };

    function writeConfigFile(){

        stats = fs.existsSync(gorillaFile);
        if(stats){
            fs.writeFileSync(gorillaFile, JSON.stringify(config, null, '\t'));
        }
    }

    return module;
}
