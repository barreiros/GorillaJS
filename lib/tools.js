var run = require('run-sequence');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');
var prompt = require('readline-sync');
var spawnSync = require('child_process').spawnSync;
var mergeJson = require('object-merge');
var cross = require(__dirname + '/crossExec.js');
var through = require('through2');

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

        var platform;

        cross.spawnSync('uname', ['-s'],  function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['014']);
            events.publish('VERBOSE', [stderr]);

            stdout = stdout.toLowerCase();
            if(stdout.search('linux') >= 0){
                platform = 'linux';
            }else if(stdout.search('darwin') >= 0){
                platform = 'darwin';
            }else{
                platform = 'other';
            }
        });

        return platform;
    },

    provision: function(template){
        events.publish('STEP', ['tools-provision']);

        var commands, ssh;

        if(fs.existsSync(template)){
            commands = fs.readFileSync(template);
        }

        cross.exec(commands, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['012']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');
        });
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

            gorillaFile = projectPath + '/' + gorillaFolder + '/' + gorilla;
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

        var messagesFileTemplate, gorillaFileDocker, configDocker, messagesTemplate, port;

        cross.moveFiles(projectPath + '/' + gorillaFolder, false, ['.DS_Store'], templatesPath + '/common');
        cross.moveFiles(projectPath + '/' + gorillaFolder, false, ['.DS_Store'], templatesPath + '/' + template);

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

        if(!config[env].hasOwnProperty('docker')){
            config[env]['docker'] = {};
            config[env]['docker']['port'] = Math.floor(Math.random() * (4999 - 4700)) + 4700;
        }else{
            if(!config[env]['docker'].hasOwnProperty('port')){
                config[env]['docker']['port'] = Math.floor(Math.random() * (4999 - 4700)) + 4700;
            }
        }
        writeConfigFile();
    },

    removeDir: function(path){

        cross.spawnSync('rm', ['-r', path], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['019']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');
        });
    },

    setEnvVariables: function(paths){
        events.publish('STEP', ['tools-setvariables']);

        var valuesToReplace, valuesTaken, tempenv, group, key, value;

        valuesToReplace = [];
        valuesTaken = [];

        // Relleno el array con los valores del nodo (env) que tengo en el gorillafile.
        for(group in config[env]){
            if(typeof config[env][group] === 'object'){
                for(key in config[env][group]){
                    if(config[env][group][key] !== ''){
                        if(valuesTaken.indexOf(env + '.' + group) === -1){
                            value = ['${' + group + '.' + key + '}', module.exports.param(group, key)];
                            valuesToReplace.push(value);
                            valuesTaken.push(env + '.' + group);
                        }
                    }
                }
            }else{
                if(config[env][group] !== ''){
                    if(valuesTaken.indexOf(env + '.' + group) === -1){
                        value = ['${' + group + '}', module.exports.param(env, group)];
                        valuesToReplace.push(value);
                        valuesTaken.push(env + '.' + group);
                    }
                }
            }
        }

        // Una vez parseados, reemplazo los valores.
        gulp.src(paths)
            .pipe(through.obj(function (chunk, enc, cb) {
                var str, arr, strIn, strOut;

                if(!chunk.isDirectory()){
                    str = chunk._contents.toString();
                    while(true){
                        strIn = str.search(/\${/);
                        if(strIn > -1){
                            str = str.replace(str.substring(0, strIn), '');
                            strOut = str.search('}');
                            arr = str.substring(2, strOut).split('.');
                            if(arr.length === 2){
                                if(valuesTaken.indexOf(arr.join('.')) === -1){
                                    value = ['${' + arr.join('.') + '}', module.exports.param(arr[0], arr[1])];
                                    valuesToReplace.push(value);
                                    valuesTaken.push(arr.join('.'));
                                }
                            }
                            str = str.replace(str.substring(0, strOut), '');
                        }else{
                            break;
                        }
                    }
                }

                cb();
            }))
        .on('finish', function(){

            gulp.src(paths)
                .pipe(replace(valuesToReplace))
                .pipe(gulp.dest(function(data){
                    return data.base;
                }))
            .on('finish', function(){
                events.publish('PROMISEME');
            });
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

    paramForced: function(step, name, value){
        if(!config[env].hasOwnProperty(step)){
            config[env][step] = {};
        }
        config[env][step][name] = value;
        writeConfigFile();
    },

    param: function(step, name, options, filter, save){

        var value, stats, exist, key, defaultValue, message;
        
        save = save === false ? false : true;

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
                        message = messages.questions[step][name] + ' ';
                    }
                }
            }
            if(message === ''){
                if(options){
                    message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Select the ' + step + ' ' + name + ' value from the list above ';
                }else{
                    message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Enter the ' + step + ' ' + name + ' value ';
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
                                message + ('[' + defaultValue + '] ').bold,
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
            if(typeof filter === 'function'){
                config[env][step][name] = filter(value);
            }else{
                config[env][step][name] = value;
            }
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
    

    sanitize: function(string){
        string = string.replace(/^\s+|\s+$/g, ''); // trim
        string = string.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_-,:;";
        var to =   "                             ";
        // var to   = "aaaaeeeeiiiioooouuuunc       ";
        for (var i=0, l=from.length ; i<l ; i++) {
            string = string.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        string = string.replace(/[^a-z0-9]/g, '') // remove invalid chars
            .replace(/\s+/g, '') // collapse whitespace and replace by -
            .replace(/-+/g, ''); // collapse dashes

        return string;
    },

    lineExists: function(file, line){

        var stream;

        stream = fs.readFileSync(file).toString();
        if(stream.search(line) === -1){
            return false;
        }else{
            return true;
        }
    },

    fusionObjectNodes: function(node1, node2, object){

        var output;

        if(object.hasOwnProperty(node2)){
            output = object[node1];
            output = output.concat(object[node2]);
        }else{
            output = object[node1];
        }

        return output;
    },

    filterPaths: function(subtract,  paths){

        if(subtract !== '.' && subtract !== ''){
            paths = paths.filter(function(value){
                if(value.search(subtract) === 0){
                    return value;
                }
            }).map(function(value){
                value = value.substring(subtract.length + 1, value.length);
                return value;
            });
        }

        return paths;
    },

    removeValueInArray: function(value, array){
        
        for(var i = array.length - 1; i >= 0; i--) {
            if(array[i] === value) {
                array.splice(i, 1);
            }
        }
    },

    selectArrayValue: function(node, object){
        if(typeof object[node] !== 'undefined'){
            return object[node];
        }else{
            return 'last';
        }
    },

    addLine: function(file, line, sudo){
        if(sudo){
            cross.exec('sudo -- sh -c "echo \'' + line + '\' >> ' + file + '"', function(err, stdout, stderr){});
        }else{
            cross.exec('echo "' + line + '" >> "' + file + '"', function(err, stdout, stderr){});
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
            message = message.toString();
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
