var path = require('path');
var run = require('run-sequence');
var escapeRegExp = require('escape-string-regexp');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');
var prompt = require('readline-sync');
var execSync = require('child_process').execSync;
var mergeJson = require('object-merge');
var cross = require(__dirname + '/crossExec.js');

var promises = [];
var config = {};
var errors;
var gorillaFile;
var messages;
var platform;
var env;

module.exports = {

    config: function(environment){
        env = environment;
    },

    getPlatform: function(){

        if(!platform){
            cross.exec('uname -s',  function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['014']);
                events.publish('VERBOSE', [stderr]);

                platform = stdout;
                events.publish('PROMISEME');
            });
        }else{
            return platform;
        }
    },

    provision: function(templatesPath){
        events.publish('STEP', ['tools-provision']);

        var commands, ssh;

        if(fs.existsSync(templatesPath + '/default/remote-provision.sh')){
            commands = fs.readFileSync(templatesPath + '/default/remote-provision.sh');
        }

        cross.exec(commands, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['012']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');
        });
    },

    promises: function(){
        return promises;
    },

    createBaseEnvironment: function(projectPath, templatesPath, gorillaPath, gorilla, gorillaFolder, messagesFile){

        if(fs.existsSync(templatesPath + '/default/' + messagesFile)){
            messages = JSON.parse(fs.readFileSync(templatesPath + '/default/' + messagesFile));
        }

        if(projectPath === gorillaPath){

            events.publish('ERROR', ['000']);
        }else{

            events.publish('STEP', ['tools-createbase']);

            if(!fs.existsSync(gorillaFolder)){
                fs.mkdirSync(gorillaFolder);
            }

            gorillaFile = projectPath + '/' + gorilla;
            if(!fs.existsSync(gorillaFile)){
                fsx.ensureFileSync(gorillaFile);
                if(fs.existsSync(templatesPath + '/default/' + gorilla)){
                    config = JSON.parse(fs.readFileSync(templatesPath + '/default/' + gorilla));
                }else{
                    config['default'] = {};
                }
                writeConfigFile();
            }else{
                config = JSON.parse(fs.readFileSync(gorillaFile).toString());
            }
        }
    },

    createTemplateEnvironment: function(projectPath, templatesPath, template, gorillaFolder, gorilla, messagesFile){
        events.publish('STEP', ['tools-createtemplate']);

        var messagesFileTemplate, gorillaFileDocker, configDocker, messagesTemplate;

        module.exports.moveFiles([templatesPath + '/' + template, projectPath + '/' + gorillaFolder]);

        messagesFileTemplate = projectPath + '/' + gorillaFolder + '/' + messagesFile;
        if(fs.existsSync(messagesFileTemplate)){
            messagesTemplate = JSON.parse(fs.readFileSync(messagesFileTemplate).toString());
            messages = mergeJson(messages, messagesTemplate);
        }

        gorillaFileDocker = projectPath + '/' + gorillaFolder + '/' + gorilla;
        if(fs.existsSync(gorillaFileDocker)){
            configDocker = JSON.parse(fs.readFileSync(gorillaFileDocker).toString());
            config = mergeJson(configDocker, config);
        }

        config[env].docker.port = Math.floor(Math.random() * (4999 - 4700)) + 4700;
        writeConfigFile();
    },

    moveFiles: function(args){
        events.publish('STEP', ['tools-movefiles']);

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
            }
        });

        events.publish('PROMISEME');
    },

    removeDir: function(path){

        execSync('rm -r ' + path);
    },

    setEnvVariables: function(paths){
        events.publish('STEP', ['tools-setvariables']);

        var valuesToReplace, tempenv, group, key, value;

        valuesToReplace = [];

        // Esta primera parte se encarga de buscar todos los valores de los otros entornos y convertirlos en clave de reemplazo. Esto sirve para cambiar los valores de variables que no tienen el formato inicial ("${valor.valor}").
        for(tempenv in config){
            for(group in config[tempenv]){
                if(typeof config[tempenv][group] === 'object'){
                    for(key in config[tempenv][group]){
                        value = [config[tempenv][group][key], module.exports.param(group, key)];
                    }
                }else{
                    if(config[env][group] !== ''){
                        // value = [config[tempenv][group], config[env][group]];
                        value = [config[tempenv][group], module.exports.param(env, group)];
                        valuesToReplace.push(value);
                    }
                }
            }
        }

        // Esta segunda parte busca las cadenas con el formato de clave por defecto ("${}").
        for(group in config[env]){
            if(typeof config[env][group] === 'object'){
                for(key in config[env][group]){
                    if(config[env][group][key] !== ''){
                        // value = ['${' + group + '.' + key + '}', config[env][group][key]];
                        value = ['${' + group + '.' + key + '}', module.exports.param(group, key)];
                        valuesToReplace.push(value);
                    }
                }
            }else{
                if(config[env][group] !== ''){
                    // value = ['${' + group + '}', config[env][group]];
                    value = ['${' + group + '}', module.exports.param(env, group)];
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
    },

    resetEnvVariables: function(paths){

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
    },

    existsParam: function(step, name){

        var out;

        if(config.hasOwnProperty(step)){
            if(name){
                if(config[step].hasOwnProperty(name)){
                    out = true;
                }else{
                    out = false;
                }
            }else{
                out = true;
            }
        }else{
            out = false;
        }

        return out;
    },

    param: function(step, name, options){

        var value, stats, exist, key, save, defaultValue, message;
        
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

        save = true;
        defaultValue = '';
        message = '';
        if(exist){
            value = config[env][step][name];
        }else{
            // Como no existe la clave, o el valor está vacío, busco una opción en el objeto default. Si la encuentro, la añado a las opciones.
            if(config["default"].hasOwnProperty(step)){
                if(config["default"][step].hasOwnProperty(name)){
                    defaultValue = config["default"][step][name].toString(); 
                }
            }

            if(messages.hasOwnProperty('questions')){
                if(messages.questions.hasOwnProperty(step)){
                    if(messages.questions[step].hasOwnProperty(name)){
                        message = messages.questions[step][name];
                    }
                }
            }
            if(message === ''){
                if(options){
                    message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Select from below the ' + step + ' ' + name + ' value: ';
                }else{
                    message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Enter the ' + step + ' ' + name + ' value: ';
                }
            }else{
                message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' ' + message;
            }

            if(options){
                key = prompt.keyInSelect(
                        options, 
                        message,
                        {
                            cancel: false, 
                            guide: false
                        });
                if(options[key].toLowerCase() === 'other'){
                    value = prompt.question(
                            message,
                            {});
                }else{
                    value = options[key];
                }
            }else{
                if(name.indexOf('pass') > -1 || name.indexOf('token') > -1){
                    value = prompt.question(
                            message + ' (GorillaJS never store your passwords) ',
                            {
                                hideEchoBack: true, 
                                mask: ''
                            });
                    save = false;
                }else{
                    if(defaultValue !== ''){
                        value = prompt.question(
                                message + ' (def: ' + defaultValue.bold + ') ',
                                {
                                    defaultInput: defaultValue
                                });
                    }else{
                        value = prompt.question(
                                message,
                                {});
                    }
                }
            }
        }

        if(save){
            config[env][step][name] = value;
            writeConfigFile();
        }

        return value;
    },

    envFilter: function(allowed){

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
    },
    
    promiseme: function(){

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
    },

    showError: function(error){
        if(messages.errors.hasOwnProperty(error)){
            console.log('[GorillaJS]'.bold.grey + '[Error]'.bold.red, messages.errors[error]);
        }
    },

    showWarning: function(warning){
        if(messages.warnings.hasOwnProperty(warning)){
            console.log('[GorillaJS]'.bold.grey + '[Warning]'.bold.yellow, messages.warnings[warning]);
        }
    },

    showStep: function(step){
        if(messages.steps.hasOwnProperty(step)){
            console.log('[GorillaJS]'.bold.grey + '[Step]'.bold, messages.steps[step]);
        }
    },

    showVerbose: function(message){
        if(message){
            if(message.length > 0){
                console.log('[System]'.bold.grey + '[Verbose]'.bold.blue, message);
            }
        }
    },

    showMessage: function(message){
        console.log('[GorillaJS]'.bold.grey + '[Message]'.bold, message);
    }
}

function writeConfigFile(){

    stats = fs.existsSync(gorillaFile);
    if(stats){
        fs.writeFileSync(gorillaFile, JSON.stringify(config, null, '\t'));
    }
}
