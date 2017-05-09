var path = require('path');
var url = require('url');
var run = require('run-sequence');
var replace = require('gulp-batch-replace');
var fs = require('fs');
var fsx = require('fs-extra');
var gulp = require('gulp');
var inquirer = require('inquirer');
var spawnSync = require('child_process').spawnSync;
var through = require('through2');
var readline = require('readline');
var art = require('ascii-art');
var dns = require('dns');
var mergeJSON = require('merge-json');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));

var configData = {};
var config = {};
var gorillaFile;
var env;

module.exports = {
    isNewProject: isNewProject,
    isLocalProject: isProjectInLocalMachine,
    printLogo: printLogo,
    printVersion: printVersion,
    retrieveConfigData: retrieveConfigData,
    config: configuration,
    force: saveOldData,
    provision: provision,
    createGorillaFile: createGorillaFile,
    checkTemplatePath: checkTemplatePath,
    removeDir: removeDir,
    setEnvVariables: setEnvVariables,
    resetEnvVariables: resetEnvVariables,
    existsParam: existsParam,
    paramForced: paramForced,
    param: param,
    answer: answer,
    envFilter: envFilter,
    basename: basename,
    sanitize: sanitize,
    lineExists: lineExists,
    fusionObjectNodes: fusionObjectNodes,
    filterPaths: filterPaths,
    removeValueInArray: removeValueInArray,
    selectArrayValue: selectArrayValue,
    selectObjectValue: selectObjectValue,
    runFileCommands: runFileCommands,
    showError: showError,
    showWarning: showWarning,
    showStep: showStep,
    showVerbose: showVerbose,
    showMessage: showMessage
}

function isNewProject(gorillaFile){

    if(fs.existsSync(gorillaFile)){

        events.publish('PROMISEME', 'no');

    }else{

        events.publish('PROMISEME', 'yes');

    }

}

function isProjectInLocalMachine(domain){

    dns.lookup(domain, function(err, addresses, family){

        if(addresses === "127.0.0.1" || addresses === "127.0.53.53" || typeof addresses === "undefined"){

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

function retrieveConfigData(userPath, template){

    var newFile, globalFile, newJSON, globalJSON, outputJSON;

    globalFile = path.join(userPath, 'config.json');
    if(fs.existsSync(globalFile)){

        globalJSON = JSON.parse(fs.readFileSync(globalFile));

    }else{

        globalJSON = {};

    }

    if(template === 'overwrite'){

        newFile = path.join(userPath, 'config-overwrite.json');

    }else{

        newFile = path.join(userPath, 'templates', template, 'config.json');

    }

    if(fs.existsSync(newFile)){

        newJSON = JSON.parse(fs.readFileSync(newFile));
        outputJSON = mergeJSON.merge(globalJSON, newJSON);
        configData = outputJSON;

        fs.writeFileSync(globalFile, JSON.stringify(outputJSON, null, '\t'));

    }

    events.publish('PROMISEME');

}

function saveOldData(gorillaFile){
    
    var data;

    oldData = null;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.hasOwnProperty('local')){

            if(data.local.hasOwnProperty('project')){

                if(data.local.project.hasOwnProperty('id')){

                    oldData = data.local.project.id;

                }

            }

        }

    }

    events.publish('PROMISEME', oldData);

}

function basename(urlString){

    var name;

    name = url.parse(urlString).pathname;
    name = name.replace(/\.[^/.]+$/, '');

    events.publish('PROMISEME', name);

}

function sanitize(string, separator){

    if(string.charAt(0) === '/'){

        string = string.substr(1);

    }

    string = string.replace(/^\s+|\s+$/g, ''); // trim
    string = string.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_-,:;";
    for (var i=0, l=from.length ; i<l ; i++) {
        string = string.replace(new RegExp(from.charAt(i), 'g'), separator);
    }

    string = string.replace(/[^a-z0-9]/g, separator) // remove invalid chars
        .replace(/\s+/g, separator) // collapse whitespace and replace by -
        .replace(/-+/g, separator); // collapse dashes

    events.publish('PROMISEME', string);

}

function selectArrayValue(object, node){

    if(node === 'last'){
        return object[object.length - 1]; 
    }else if(typeof object[node] !== 'undefined'){
        return object[node];
    }else{
        return 'last';
    }
}

function selectObjectValue(object, node){

    events.publish('PROMISEME', object[node.toLowerCase()]);

}

function showError(error){

    if(configData.hasOwnProperty('messages')){

        if(configData.messages.hasOwnProperty('errors')){

            if(configData.messages.errors.hasOwnProperty(error)){

                console.log('!'.bold.red, configData.messages.errors[error].bold.red);

            }

        }

    }else{

        console.log('!'.bold.red, error.bold.red);

    }

}

function showWarning(warning){

    if(configData.hasOwnProperty('messages')){

        if(configData.messages.hasOwnProperty('warnings')){

            if(configData.messages.warnings.hasOwnProperty(warning)){

                console.log('!'.bold.yellow, configData.messages.warnings[warning].bold.yellow);

            }

        }

    }

}

function showStep(step){

    if(configData.hasOwnProperty('messages')){

        if(configData.messages.hasOwnProperty('steps')){

            if(configData.messages.steps.hasOwnProperty(step)){

                console.log('#'.bold, configData.messages.steps[step].bold);

            }else{

                console.log('#'.bold, step);

            }

        }else{

            console.log('#'.bold, step);

        }

    }else{

        console.log('#'.bold, step);

    }

    events.publish('PROMISEME');

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

function param(step, name, options, filter, save, type){

    var value, stats, key, defaultValue, message;
    
    save = save === false ? false : true;
    name = typeof name === 'undefined' ? '' : name;
    defaultValue = '';
    message = '';

    if(configData.hasOwnProperty('global')){

        if(configData.global.hasOwnProperty(step)){

            if(configData.global[step].hasOwnProperty(name)){

                value = configData.global[step][name];

            }

        }

    }

    if(config.hasOwnProperty(env)){

        if(config[env].hasOwnProperty(step)){

            if(config[env][step].hasOwnProperty(name)){

                value = config[env][step][name];

            }

        }

    }

    if(typeof value !== 'undefined'){

        events.publish('PROMISEME', value);

    }else{

        if(configData.hasOwnProperty('default')){

            if(defaultValue === '' && configData.default.hasOwnProperty(step)){

                if(configData.default[step].hasOwnProperty(name)){

                    defaultValue = configData.default[step][name].toString(); 

                }

            }

        }

        if(configData.hasOwnProperty('messages')){

            if(configData.messages.hasOwnProperty('questions')){

                if(configData.messages.questions.hasOwnProperty(step)){

                    if(configData.messages.questions[step].hasOwnProperty(name)){

                        message = configData.messages.questions[step][name] + ' ';

                    }

                }

            }

        }

        if(message === ''){
            if(options){
                message = ('Select the ' + step + ' ' + name + ' value from the list above ').green;
            }else{
                message = ('Enter the ' + step + ' ' + name + ' value ').green;
            }
        }else{
            message = message.green;
        }


        if(options){

            if(type === 'checkbox'){

                inquirer.prompt([{
                    type: 'checkbox',
                    name: 'option',
                    message: message,
                    choices: options
                }], function(answers){

                    console.log(answers);

                });

            }else if(typeof options === 'object'){

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
    
    var valuesToReplace, valuesTaken, tempenv, group, key, value, configMerge;

    valuesToReplace = [];
    valuesTaken = [];

    configMerge = mergeJSON.merge(configData.global, config[env]);

    // Creo un nuevo archivo de configuración uniendo los valores globales.
    // Relleno el array con los valores del nodo (env) que tengo en el gorillafile.
    // No uso la función param porque las variables que necesito ya las he pedido en la función setEnvVariables.
    for(group in configMerge){

        if(typeof configMerge[group] === 'object'){

            for(key in configMerge[group]){

                if(configMerge[group][key] !== ''){

                    if(valuesTaken.indexOf(env + '.' + group) === -1){

                        value = ['{{' + group + '.' + key + '}}', configMerge[group][key]];
                        valuesToReplace.push(value);
                        valuesTaken.push(group + '.' + key);
                    }
                }
            }

        }else{

            if(configMerge[group] !== ''){

                if(valuesTaken.indexOf(group + '.' + key) === -1){

                    value = ['{{' + group + '}}', configMerge[group]];
                    valuesToReplace.push(value);
                    valuesTaken.push(group + '.' + key);

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

function setEnvVariables(path, exclude){

    var stream, buffer, results, result, controlRepeated, arrResult, promisesPack;

    promisesPack = [];
    controlRepeated = [];

    stream = gulp.src(path, exclude)
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

function createGorillaFile(gorillaFilePath, gorillaFolderPath){

    var id; 

    gorillaFile = gorillaFilePath;
    id = '';

    if(fs.existsSync(gorillaFile)){

        config = JSON.parse(fs.readFileSync(gorillaFile).toString());

    }else{

        fsx.ensureFileSync(gorillaFile);

        if(!config.hasOwnProperty(env)){

            config[env] = {};

        }

        writeConfigFile();

    }

    if(config[env].hasOwnProperty('project')){

        if(config[env].project.hasOwnProperty('id')){

            id = config[env].project.id;

        }

    }

    events.publish('PROMISEME', id);

}

function checkTemplatePath(defaultTemplates, template, defaultPath){
    if(defaultTemplates.indexOf(template) !== -1){
        return path.join(defaultPath, template);
    }else{
        return template;
    }
}

function provision(template){

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

    if(!config.hasOwnProperty(env)){

        config[env] = {};
        config[env][step] = {};

    }else if(!config[env].hasOwnProperty(step)){

        config[env][step] = {};

    }

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

    fsx.ensureFileSync(gorillaFile);
    fs.writeFileSync(gorillaFile, JSON.stringify(config, null, '\t'));

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

        cross.exec(commands, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['027']);
            events.publish('VERBOSE', [stdout + stderr]);

            events.publish('PROMISEME');
        }, true);
    }else{
        events.publish('PROMISEME');
    }
}

