var path = require('path');
var run = require('run-sequence');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');
var inquirer = require('inquirer');
var spawnSync = require('child_process').spawnSync;
var mergeJson = require('object-merge');
var cross = require(__dirname + '/crossExec.js');
var through = require('through2');
var promises = require(__dirname + '/promises.js');
var readline = require('readline');
var art = require('ascii-art');
var dns = require('dns');

var config = {};
var errors;
var gorillaFile;
var messages;
var env;

module.exports = {
    setVarnish: setVarnish,
    isLocalProject: isProjectInLocalMachine,
    printLogo: printLogo,
    printVersion: printVersion,
    config: configuration,
    force: saveOldData,
    provision: provision,
    createBaseEnvironment: createBaseEnvironment,
    createTemplateEnvironment: createTemplateEnvironment,
    checkTemplatePath: checkTemplatePath,
    removeDir: removeDir,
    setEnvVariables: setEnvVariables,
    resetEnvVariables: resetEnvVariables,
    existsParam: existsParam,
    paramForced: paramForced,
    param: param,
    answer: answer,
    envFilter: envFilter,
    sanitize: sanitize,
    lineExists: lineExists,
    fusionObjectNodes: fusionObjectNodes,
    filterPaths: filterPaths,
    removeValueInArray: removeValueInArray,
    selectArrayValue: selectArrayValue,
    runFileCommands: runFileCommands,
    showError: showError,
    showWarning: showWarning,
    showStep: showStep,
    showVerbose: showVerbose,
    showMessage: showMessage
}

function setVarnish(gorillaPath, templatePath, templatesPath, proxyPath, varnish, domain){
    
    var file, destiny;

    destiny = path.join(proxyPath, varnish) + '/' + domain + '.vcl';
    fsx.ensureDirSync(proxyPath);

    if(fs.existsSync(gorillaPath + '/' + varnish)){

        file = gorillaPath + '/' + varnish;
        fsx.copySync(file, destiny);
        
    }else{

        if(fs.existsSync(templatePath + '/' + varnish)){

            file = templatePath + '/' + varnish;

        }else{

            file = templatesPath + '/proxy/' + varnish;

        }

        fsx.copySync(file, gorillaPath + '/' + varnish);
        fsx.copySync(file, destiny);

    }
    

    events.publish('PROMISEME', destiny);

}

function isProjectInLocalMachine(domain){

    dns.lookup(domain, function(err, addresses, family){

        if(addresses === "127.0.0.1" || typeof addresses === "undefined"){

            events.publish('PROMISEME', 'yes');

        }else{

            events.publish('PROMISEME', 'no');

        }

    });
}

function printLogo(){

    art.font('GorillaJS', 'Doom', function(rendered){

        console.log('\n');
        console.log(rendered);
        events.publish('PROMISEME');

    });

}

function printVersion(){

    var json;

    json = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'))

    return json.version;

}

function configuration(environment){

    env = environment;

    return env;
}

function saveOldData(gorillaFile){
    
    var data;

    oldData = null;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.hasOwnProperty('local')){

            if(data.local.hasOwnProperty('project')){

                if(data.local.project.hasOwnProperty('domain')){

                    oldData = data.local.project.domain;

                }

            }

        }

    }

    events.publish('PROMISEME', oldData);

}

function sanitize(string){

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

    
    events.publish('PROMISEME', string);

}

function selectArrayValue(node, object){

    if(node === 'last'){
        return object[object.length - 1]; 
    }else if(typeof object[node] !== 'undefined'){
        return object[node];
    }else{
        return 'last';
    }
}

function showError(error){

    if(messages){

        if(messages.hasOwnProperty('errors')){

            if(messages.errors.hasOwnProperty(error)){

                console.log('!'.bold.red, messages.errors[error].bold.red);

            }

        }

    }

}

function showWarning(warning){

    if(messages){

        if(messages.hasOwnProperty('warnings')){

            if(messages.warnings.hasOwnProperty(warning)){

                console.log('!'.bold.yellow, messages.warnings[warning].bold.yellow);

            }

        }

    }

}

function showStep(step){

    if(messages){

        if(messages.hasOwnProperty('steps')){

            if(messages.steps.hasOwnProperty(step)){

                console.log('#'.bold, messages.steps[step].bold);

            }

        }

    }

}

function showVerbose(message){
    if(message){
        message = message.toString();
        if(message.length > 0){
            // console.log('[System]'.bold.grey + '[Verbose]'.bold.blue, message);
            console.log('#'.bold.cyan, message.bold.cyan);
        }
    }
}

function showMessage(message){
    // console.log('[GorillaJS]'.bold.grey + '[Message]'.bold, message);
    console.log('#'.bold, message.bold);
}

function fusionObjectNodes(node1, node2, object){

    var output;

    if(object.hasOwnProperty(node2)){
        output = object[node1];
        output = output.concat(object[node2]);
    }else{
        output = object[node1];
    }

    return output;
}

function filterPaths(subtract, paths){

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
}

function removeValueInArray(value, array){
        
    for(var i = array.length - 1; i >= 0; i--) {
        if(array[i] === value) {
            array.splice(i, 1);
        }
    }
}

function lineExists(file, line){

    var stream;

    stream = fs.readFileSync(file).toString();
    if(stream.search(line) === -1){
        return false;
    }else{
        return true;
    }
}

function envFilter(allowed){

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
}

function paramForced(step, name, value){

    if(!config.hasOwnProperty(env)){
        config[env] = {};
    }

    if(!config[env].hasOwnProperty(step)){
        config[env][step] = {};
    }

    config[env][step][name] = value;
    writeConfigFile();

    events.publish('PROMISEME', value);

}

function param(step, name, options, filter, save){

    var value, stats, exist, key, defaultValue, message;
    
    save = save === false ? false : true;
    name = typeof name === 'undefined' ? '' : name;

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
        events.publish('PROMISEME', value);

    }else{

        if(defaultValue === '' && config["default"].hasOwnProperty(step)){
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
                // message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Select the ' + step + ' ' + name + ' value from the list above ';
                message = ('Select the ' + step + ' ' + name + ' value from the list above ').green;
            }else{
                // message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' Enter the ' + step + ' ' + name + ' value ';
                message = ('Enter the ' + step + ' ' + name + ' value ').green;
            }
        }else{
            // message = '[GorillaJS]'.bold.grey + '[Value]'.bold.green + ' ' + message;
            message = message.green;
        }


        if(options){
            if(typeof options === 'object'){

                events.publish('QUESTION', [{
                    type: 'list',
                    step: step,
                    name: name,
                    choices: options
                }]);

                inquirer.prompt([{
                    type: 'list',
                    name: 'option',
                    message: message,
                    choices: options
                }], function(answers){
                    if(answers.option.toLowerCase() === 'other'){
                        inquirer.prompt([{
                            type: 'input',
                            name: 'option',
                            message: message
                        }], function(answers){
                            if (save) saveValue(step, name, answers.option, filter);
                            events.publish('ANSWER', answers.option);
                        });
                    }else{
                        if (save) saveValue(step, name, answers.option, filter);
                        events.publish('ANSWER', answers.option);
                    }
                });
            }else{

                events.publish('QUESTION', [{
                    type: 'confirm',
                    step: step,
                    name: name
                }]);

                inquirer.prompt([{
                    type: 'confirm',
                    name: 'option',
                    message: message,
                    default: false 
                }], function(answers){
                    if (save) saveValue(step, name, answers.option, filter);
                    events.publish('ANSWER', answers.option);
                });

            }

        }else{

            if(name.indexOf('pass') > -1 || name.indexOf('token') > -1){
                    
                events.publish('QUESTION', [{
                    type: 'password',
                    step: step,
                    name: name
                }]);

                inquirer.prompt([{
                    type: 'password',
                    name: 'option',
                    // message: message + ' (GorillaJS never store your passwords) ',
                    message: message,
                }], function(answers){
                    if (save) saveValue(step, name, answers.option, filter);
                    events.publish('ANSWER', answers.option);
                });

            }else{

                if(defaultValue !== ''){
                    
                    events.publish('QUESTION', [{
                        type: 'input',
                        step: step,
                        name: name,
                        default: defaultValue
                    }]);

                    inquirer.prompt([{
                        type: 'input',
                        name: 'option',
                        message: message,
                        default: defaultValue
                    }], function(answers){
                        if (save) saveValue(step, name, answers.option, filter);
                        events.publish('ANSWER', answers.option);
                    });

                }else{
                    
                    events.publish('QUESTION', [{
                        type: 'input',
                        step: step,
                        name: name
                    }]);

                    inquirer.prompt([{
                        type: 'input',
                        name: 'option',
                        message: message
                    }], function(answers){
                        if (save) saveValue(step, name, answers.option, filter);
                        events.publish('ANSWER', answers.option);
                    });

                }
            }
        }
    }
}

function answer(answer){

    events.publish('PROMISEME', answer);

}

function existsParam(step, name){

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
}

function resetEnvVariables(path){

    var valuesToReplace, group, key, value;

    valuesToReplace = [];

    for(group in config[env]){
        if(typeof config[env][group] === 'object'){
            for(key in config[env][group]){
                if(config[env][group][key] !== ''){
                    value = [config[env][group][key], '{{' + group + '.' + key + '}}'];
                    valuesToReplace.push(value);
                }
            }
        }else{
            if(config[env][group] !== ''){
                value = [config[env][group], '{{' + group + '}}'];
                valuesToReplace.push(value);
            }
        }
    }

    gulp.src(path)
        .pipe(replace(valuesToReplace))
        .pipe(gulp.dest(function(data){
            return data.base;
        }))
        .on('finish', function(){
            events.publish('PROMISEME');
        })
}

function removeDir(path){

    if(process.platform === 'win32'){

        cross.exec('RD /S /Q ' + path, function(err, stdout, stderr){

            if (err) events.publish('ERROR', ['019']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');

        });

    }else{

        cross.exec('rm -r ' + path, function(err, stdout, stderr){

            if (err) events.publish('ERROR', ['019']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');

        });

    }
}

function changeValuesInFiles(path){
    
    var valuesToReplace, valuesTaken, tempenv, group, key, value;

    valuesToReplace = [];
    valuesTaken = [];

    // Relleno el array con los valores del nodo (env) que tengo en el gorillafile.
    // No uso la función param porque las variables que necesito ya las he pedido en la función setEnvVariables.
    for(group in config[env]){

        if(typeof config[env][group] === 'object'){

            for(key in config[env][group]){

                if(config[env][group][key] !== ''){

                    if(valuesTaken.indexOf(env + '.' + group) === -1){

                        value = ['{{' + group + '.' + key + '}}', config[env][group][key]];
                        valuesToReplace.push(value);
                        valuesTaken.push(env + '.' + group);
                    }
                }
            }

        }else{

            if(config[env][group] !== ''){

                if(valuesTaken.indexOf(env + '.' + group) === -1){

                    value = ['{{' + group + '}}', config[env][group]];
                    valuesToReplace.push(value);
                    valuesTaken.push(env + '.' + group);
                }
            }
        }

    }

    // Una vez parseados, reemplazo los valores.
    gulp.src(path)
        .pipe(through.obj(function (chunk, enc, cb) {
            var str, arr, strIn, strOut;

            if(!chunk.isDirectory()){
                str = chunk._contents.toString();
                while(true){
                    strIn = str.search(/\{{/);
                        if(strIn > -1){
                            str = str.replace(str.substring(0, strIn), '');
                            strOut = str.search('}}');
                            arr = str.substring(2, strOut).split('.');
                            if(arr.length === 2){
                                if(valuesTaken.indexOf(arr.join('.')) === -1){
                                    value = ['{{' + arr.join('.') + '}}', config[env][arr[0]][arr[1]]];
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
                    gulp.src(path)
                        .pipe(replace(valuesToReplace))
                        .pipe(gulp.dest(function(data){
                            return data.base;
                        }))
                    .on('finish', function(){
                        events.publish('PROMISEME');
                    });
                });
}

function setEnvVariables(path){

    events.publish('STEP', ['tools-setvariables']);

    var stream, buffer, results, result, controlRepeated, arrResult, promisesPack;

    promisesPack = [];
    controlRepeated = [];

    stream = gulp.src(path)
        .pipe(through.obj(function (chunk, enc, cb) {

            if(chunk._contents){

                buffer = chunk._contents.toString();
                results = buffer.match(/\{\{(.*?)\}\}/g);

                if(results){

                    for(key in results){
                        if(controlRepeated.indexOf(results[key]) === -1){
                            result = results[key].replace('{{', '');
                            result = result.replace('}}', ''); 
                            arrResult = result.split('.');

                            promisesPack.push([module.exports.param, [arrResult[0], arrResult[1]]]);

                            controlRepeated.push(results[key]);
                        }
                    }
                }

            }

            cb();

        }));

    stream.on('finish', function(){
        promisesPack.push([changeValuesInFiles, path]);
        promises.sandwich(promisesPack);
        promises.start();
    });

}

function createBaseEnvironment(projectPath, templatesPath, gorillaPath, gorilla, gorillaFolder, messagesFile, homeUserPath){

    if(fs.existsSync(path.join(templatesPath, 'default', messagesFile))){

        messages = JSON.parse(fs.readFileSync(path.join(templatesPath, 'default', messagesFile)));

    }

    if(projectPath === gorillaPath){

        events.publish('ERROR', ['000']);

    }else{

        events.publish('STEP', ['tools-createbase']);

        if(!fs.existsSync(gorillaFolder)){

            fs.mkdirSync(gorillaFolder);

        }

        gorillaFile = path.join(projectPath, gorillaFolder, gorilla);
        if(!fs.existsSync(gorillaFile)){

            fsx.ensureFileSync(gorillaFile);
            if(fs.existsSync(path.join(templatesPath, 'default', gorilla))){
                config = JSON.parse(fs.readFileSync(path.join(templatesPath, 'default', gorilla)));
            }else{
                config['default'] = {};
            }
            writeConfigFile();

        }else{

            config = JSON.parse(fs.readFileSync(gorillaFile).toString());

        }

    }

    events.publish('PROMISEME');
}

function createTemplateEnvironment(projectPath, gorillaFolder, gorilla, messagesFile, templateFolder){
    events.publish('STEP', ['tools-createtemplate']);

    var messagesFileTemplate, gorillaFileDocker, configDocker, messagesTemplate, port;

    messagesFileTemplate = path.join(projectPath, gorillaFolder, templateFolder, messagesFile);
    if(fs.existsSync(messagesFileTemplate)){
        messagesTemplate = JSON.parse(fs.readFileSync(messagesFileTemplate).toString());
        messages = mergeJson(messages, messagesTemplate);
    }

    gorillaFileDocker = path.join(projectPath, gorillaFolder, templateFolder, gorilla);
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

    events.publish('PROMISEME');
}


function checkTemplatePath(defaultTemplates, template, defaultPath){
    if(defaultTemplates.indexOf(template) !== -1){
        return path.join(defaultPath, template);
    }else{
        return template;
    }
}

function provision(template){
    events.publish('STEP', ['tools-provision']);

    var commands, ssh;

    if(fs.existsSync(template)){
        commands = fs.readFileSync(template);
    }

    cross.exec(commands, function(err, stdout, stderr){
        if (err) events.publish('ERROR', ['012']);
        events.publish('VERBOSE', [stdout + stderr]);

        events.publish('PROMISEME');
    });
}

function saveValue(step, name, value, filter){

    if(name !== ''){

        if(typeof filter === 'function'){
            config[env][step][name] = filter(value);
        }else{
            config[env][step][name] = value;
        }

    }else{
        if(typeof filter === 'function'){
            config[env][step] = filter(value);
        }else{
            config[env][step] = value;
        }

    }
    writeConfigFile();
}

function writeConfigFile(){

    stats = fs.existsSync(gorillaFile);
    if(stats){
        fs.writeFileSync(gorillaFile, JSON.stringify(config, null, '\t'));
    }
}

function runFileCommands(file){

    var commands, ssh, filePath;

    filePath = path.dirname(file);
    if(!fs.existsSync(filePath)){
        fs.mkdirSync(filePath);
    }

    fsx.ensureFileSync(file);
    commands = fs.readFileSync(file);
    if(commands.length){
        events.publish('STEP', ['tools-filecommands']);

        cross.exec(commands, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['027']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');
        }, true);
    }else{
        events.publish('PROMISEME');
    }
}

