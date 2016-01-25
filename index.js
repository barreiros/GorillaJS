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
var m_docker = require(__dirname + '/lib/docker.js');
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

if(argv._[0] === 'init' || argv._[0] === 'docker' || argv._[0] === 'pack' || argv._[0] === 'deploy' || argv._[0] === 'rollback' || argv._[0] === 'provision'){

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

        [git.createBranch, [tools.param('git', 'branchdevel')]],
        [git.add, '.'],
        [git.commit, ['GorillaJS checkpoint ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.createBranch, [tools.param('git', 'branchdeploy'), true]],
        [git.commit, ['GorillaJS rollback ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.clone, ['file://' + projectPath, tools.param('git', 'branchdevel'), projectPath + '/temp_repo/']],
        [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/' + tools.param('project', 'srcin')]],
        [tools.removeDir, projectPath + '/temp_repo/'],

        // Los archivos eliminados los tengo que recuperar de la rama de desarrollo y contar desde la fecha del último commit de la rama deploy.
        [git.listFiles, [git.commitDate(tools.param('git', 'branchdeploy')), null, tools.param('git', 'branchdevel')], 'list-devel'],
        [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
        [tools.filterPaths, [tools.param('project', 'srcin')], 'list-devel-filtered'], // last param autofilled
        [cross.removeFiles, [workingPath + '/' + tools.param('project', 'srcout'), true, null, 'promises::list-devel-filtered']],
        [cross.removeFiles, [projectPath + '/', false, null, 'promises::list-devel-filtered']],

        // Los archivos añadidos, o modificados los recupero de la rama deploy.
        [git.add, '.'],
        [git.commit, ['GorillaJS deploy ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.listFiles, [git.commitDate(tools.param('git', 'branchdeploy')), null, tools.param('git', 'branchdeploy')], 'list-deploy'],
        [tools.fusionObjectNodes, ['added', 'modified']], // last param autofilled
        [cross.moveFiles, [workingPath + '/' + tools.param('project', 'srcout'), true]],

        [git.createBranch, [tools.param('git', 'branchdevel')]],
        ssh.close
    ];
    promises.add(promisesPack);
    promises.start();
}

function rollback(){

    var promisesPack = [
        [git.config, projectPath],
        [git.initRepo, gorillaFolder],

        [git.createBranch, [tools.param('git', 'branchdeploy')]],
        [git.listCommits, [tools.param('git', 'branchdeploy'), 'rollback'], 'commits'],
        [tools.param, ['git', 'rollbackdate', 'promises::commits', null, false], 'rollback-point'],
        [git.commitDate, [tools.param('git', 'branchdeploy')], 'commit-date'], // last param autofilled
        [git.listFiles, ['promises::commit-date', datef(new Date(), 'yyyy-mm-dd HH:MM:ss o'), tools.param('git', 'branchdeploy'), true], 'list'],

        // [Aquí hago un reset --hard al commit inicial para recuperar todos los archivos],
        [git.reset, [tools.param('git', 'branchdeploy'), 'promises::rollback-point']],
        [tools.fusionObjectNodes, ['deleted', 'modified', 'promises::list']],
        [cross.moveFiles, [workingPath + '/' + tools.param('project', 'srcout'), true]], // last param autofilled

        // Como voy hacia atrás en el tiempo, los archivos eliminados ahora son añadidos y a la inversa.
        [tools.fusionObjectNodes, ['added', null, 'promises::list'], 'list-deleted'],
        [cross.removeFiles, [workingPath + '/' + tools.param('project', 'srcout'), true, null, 'promises::list-deleted']],
        [cross.removeFiles, [projectPath + '/', false, null, 'promises:list-deleted']],

        [git.createBranch, [tools.param('git', 'branchdevel')]],
        ssh.close
    ];
    promises.add(promisesPack);
    promises.start();
}

function docker(){

    var remote, promisesPack;

    promisesPack = [];
    if (ssh.get()){
        remote = true;
    }

    tools.createTemplateEnvironment(projectPath, templatesPath, tools.param('docker', 'template'), gorillaFolder, gorillaFile, messagesFile);
    tools.paramForced('docker', 'gorillafolder', gorillaFolder);

    promisesPack.push([tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']);

    if (remote) {
        promisesPack.push([cross.moveFiles, [workingPath + '/' + gorillaFolder, true, ['.DS_Store'], projectPath + '/' + gorillaFolder]]);
    }

    promisesPack.push(
        [tools.getPlatform],
        [m_docker.config],
        [m_docker.check, tools.param('docker', 'machinename'), remote],
        [m_docker.start, [tools.param('docker', 'machinename'), workingPath + '/' + gorillaFolder + '/' + composeFile, tools.param('project', 'slug', null, tools.sanitize), remote]]
        // [tools.resetEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']
    );

    if (remote){
        if(tools.param('system', 'platform', ['apache', 'nginx', 'cancel']) !== 'cancel'){
            promisesPack.push(
                [host.create, [tools.param('system', 'platform'), projectPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', workingPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', tools.param('project', 'domain')]],
                [host.open, ['http://' + tools.param('project', 'domain'), 15, 'Waiting for opening your web']]
            );
        }else{
            promisesPack.push(
                [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
            );
        }
    }else{
        if(tools.param('hosts', 'enabled', ['ip', 'domain']) === 'domain'){
            promisesPack.push(
                [host.add, [tools.param('system', 'hostsfile'), tools.param('project', 'domain'), m_docker.ip(tools.param('docker', 'machinename'))]],
                [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
            );
        }else{
            tools.paramForced('project', 'domain', m_docker.ip(tools.param('docker', 'machinename')));
            promisesPack.push([host.open, ['http://' + m_docker.ip(tools.param('docker', 'machinename')) + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]);
        }
    }

    if (remote) promisesPack.push(ssh.close);

    promises.add(promisesPack);
    promises.start();
}

function init(){

    var remote, promisesPack;

    promisesPack = [];

    if (ssh.get()){
        remote = true;
    }

    if (argv.c || argv.r) {
        promisesPack.push(
            [git.config, workingPath],
            [git.initRepo, gorillaFolder]
        );
    }

    if (argv.c) {
        promisesPack.push(
            [git.clone, [tools.param('git', 'clonefromurl'), tools.param('git', 'clonefrombranch'), projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/']],
            [tools.removeDir, projectPath + '/temp_repo/'],
            [git.createBranch, tools.param('git', 'branchdevel')],
            [git.commit, ['GorillaJS has cloned the repo ' + tools.param('git', 'clonefromurl'), true]]
        );
    }

    if (argv.r) {
        promisesPack.push(
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : tools.param('git', 'token')), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug', null, tools.sanitize)]],
            [git.addOrigin, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), tools.param('project', 'slug'), workingPath]]
        );
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
