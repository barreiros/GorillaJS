#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var exec = require('child_process').exec;
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');

var tools = require(__dirname + '/lib/tools.js');
var events = require(__dirname + '/lib/pubsub.js');
var ssh = require(__dirname + '/lib/ssh.js');
var docker = require(__dirname + '/lib/docker.js');
var git = require(__dirname + '/lib/git.js');
var host = require(__dirname + '/lib/host.js');
var cross = require(__dirname + '/lib/crossExec.js');
var promises = require(__dirname + '/lib/promises.js');

var gorillaPath = __dirname;
var gorillaFolder = '.gorilla';
var gorillaFile = 'gorillafile';
var messagesFile = 'messages';
var projectPath = process.cwd();
var templatesPath = gorillaPath + '/templates';
var composeFile = 'docker-compose.yml';
var env = argv.e ? argv.e : 'local';
var verbose = argv.v ? argv.v : false;
var workingPath = projectPath;


events.subscribe('PROMISEME', function(){
    promises.start();
});
events.subscribe('VERBOSE', function(systemMessage, force){
    if(verbose || force){
        tools.showVerbose(systemMessage);
    }
});
events.subscribe('ERROR', function(error){
    tools.showError(error);
});
events.subscribe('WARNING', function(error){
    tools.showWarning(error);
});
events.subscribe('STEP', function(step){
    tools.showStep(step);
});
events.subscribe('MESSAGE', function(message){
    tools.showMessage(message);
});


if (argv.f) tools.setConfigFile(f);

if(argv._[0] === 'init' || argv._[0] === 'pack' || argv._[0] === 'deploy' || argv._[0] === 'rollback' || argv._[0] === 'provision'){

    tools.config(env);
    tools.createBaseEnvironment(projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile);

    if(env !== 'local') {
        if(tools.param('ssh', 'enable', ['yes', 'no']) === 'yes'){
            workingPath = tools.param('ssh', 'workingpath') + '/' + tools.param('project', 'slug', null, tools.sanitize);
            promises.add([ssh.connect, [tools.param('ssh', 'host'), tools.param('ssh', 'port'), tools.param('ssh', 'username'), tools.param('ssh', 'key'), tools.param('ssh', 'passphrase')]]);
        }
    }
    promises.add(eval(argv._[0]));
    promises.start();
}

function deploy(){

    var promisesPack = [
        [git.config, projectPath],
        [git.initRepo, gorillaFolder],
        [git.createBranch, [tools.param('git', 'branchdevel'), true]],
        [git.add, '.'],
        [git.commit, ['GorillaJS deploy point ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.createBranch, [tools.param('git', 'branchdeploy'), true]],
        [git.clone, ['file://' + projectPath, tools.param('git', 'branchdevel'), projectPath + '/temp_repo/']],
        [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/' + tools.param('project', 'srcin')]],
        [tools.removeDir, projectPath + '/temp_repo/'],

        [git.listFiles, [git.commitDate(tools.param('git', 'branchdevel')), null, tools.param('git', 'branchdevel')], 'list'],
        [tools.fusionObjectNodes, ['added', 'modified']], // last param autofilled
        [tools.filterPaths, tools.param('project', 'srcin')], // last param autofilled
        [cross.moveFiles, [workingPath + '/' + tools.param('project', 'srcout'), true]],

        [promises.cache, 'list'],
        [tools.fusionObjectNodes, ['deleted']], // last param autofilled
        [tools.filterPaths, tools.param('project', 'srcin'), 'list_deleted'], // last param autofilled
        [cross.removeFiles, [workingPath + '/' + tools.param('project', 'srcout'), true]],
        [git.createBranch, [tools.param('git', 'branchdeploy')]],
        // [promises.cache, 'list_deleted'],
        // [cross.removeFiles, [projectPath + '/', false]],

        [git.add, '.'],
        [git.commit, ['GorillaJS deploy point ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.createBranch, [tools.param('git', 'branchdevel')]],
        ssh.close
    ];
    promises.add(promisesPack);
    promises.start();
}

function rollback(){

    // Creo una ista con los archivos que han cambiado hasta el último commit de la rama deploy.
    // Cambio los valores de la lista. Ahora los archivos añadidos serán los eliminados y al revés.
    // Hago un reset --hard al commit inicial.
    // Creo un lista con los archivos que han cambiado en el commit inicial de la rama deploy.
    // Comparo las dos listas y le doy preferencia a la segunda. Los archivos eliminados de la segunda lista, si en la primera aparecen como modificados o válidos, no serán eliminados.

    var listA, listB;

    var commitDate = git.commitDate(tools.param('git', 'branchdeploy'), tools.param('git', 'rollbackdate', git.listCommits(tools.param('git', 'branchdeploy')), null, false));
    var listA = git.listFiles(commitDate, datef(new Date(), 'yyyy-mm-dd HH:MM:ss o'), tools.param('git', 'branchdeploy'), true);
    var listB = git.listFiles(commitDate, commitDate, tools.param('git', 'branchdeploy'), true);
    console.log(commitDate);
    console.log(listA);
    console.log(listB);
    // listA = git.listFiles(tools.param('git', 'rollbackdate', git.listCommits(tools.param('git', 'branchdeploy')), null, false), tools.param('git', 'branchdeploy'));
    // console.log(listA);
    // tools.promises.push(
    //     [git.listFiles, ['Tue Jan 12 20:09:31 2016 +0100', tools.param('git', 'branchdevel')]],
    //
    // );
    //
    // promises.start();
}

function init(){

    var remote, promisesPack;

    promisesPack = [];

    if (ssh.get()){
        remote = true;
    }

    if (argv.d) {
        // Hago esta llamada primero para evitar el error "Segmentation fault 11". Las llamadas a funciones que no estén en promises se deberían ir primero.
        tools.createTemplateEnvironment(projectPath, templatesPath, tools.param('docker', 'template'), gorillaFolder, gorillaFile, messagesFile);
        tools.paramForced('docker', 'gorillafolder', gorillaFolder);
    }

    if (argv.c || argv.r) {
        promisesPack.push(
            [git.config, workingPath],
            [git.initRepo, gorillaFolder]
        );
    }

    if (argv.c) {
        promisesPack.add(
            [git.clone, [tools.param('git', 'clonefromurl'), tools.param('git', 'clonefrombranch'), projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/']],
            [tools.removeDir, projectPath + '/temp_repo/'],
            [git.createBranch, tools.param('git', 'branchdevel')],
            [git.commit, ['GorillaJS has cloned the repo ' + tools.param('git', 'clonefromurl'), true]]
        );
    }

    if (argv.r) {
        promisesPack.add(
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : tools.param('git', 'token')), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug', null, tools.sanitize)]],
            [git.addOrigin, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), tools.param('project', 'slug'), workingPath]]
        );
    }

    if (argv.d) {
        promisesPack.add([tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']);

        if (remote) {
            promisesPack.add([cross.moveFiles, [workingPath + '/' + gorillaFolder, true, ['.DS_Store'], projectPath + '/' + gorillaFolder]]);
        }

        promisesPack.add(
            [tools.getPlatform],
            [docker.config],
            [docker.check, tools.param('docker', 'machinename'), remote],
            [docker.start, [tools.param('docker', 'machinename'), workingPath + '/' + gorillaFolder + '/' + composeFile, tools.param('project', 'slug', null, tools.sanitize), remote]]
            // [tools.resetEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']
        );

        if (remote){
            if(tools.param('system', 'platform', ['apache', 'nginx', 'cancel']) !== 'cancel'){
                promisesPack.add(
                    [host.create, [tools.param('system', 'platform'), projectPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', workingPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', tools.param('project', 'domain')]],
                    [host.open, ['http://' + tools.param('project', 'domain'), 15, 'Waiting for opening your web']]
                );
            }else{
                promisesPack.add(
                    [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
                );
            }
        }else{
            if(tools.param('hosts', 'enabled', ['ip', 'domain']) === 'domain'){
                promisesPack.add(
                    [host.add, [tools.param('system', 'hostsfile'), tools.param('project', 'domain'), docker.ip(tools.param('docker', 'machinename'))]],
                    [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
                );
            }else{
                tools.paramForced('project', 'domain', docker.ip(tools.param('docker', 'machinename')));
                promisesPack.add([host.open, ['http://' + docker.ip(tools.param('docker', 'machinename')) + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]);
            }
        }
        if (remote) promisesPack.add(ssh.close);
    }
    promises.add(promisesPack);
    promises.start();
}

function provision(){
    
    var promisesPack;

    promisesPack.push(
        [tools.provision, [projectPath + '/' + gorillaFolder + '/remote-provision.sh']],
        // ssh.interactive,
        [ssh.close]
    );
    promises.add(promisesPack);
    promises.start();
}
