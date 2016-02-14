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
var commonPath = projectPath + '/' + gorillaFolder + '/common';
var composeFile = 'docker-compose.yml';
var env = argv.e ? argv.e : 'local';
var verbose = argv.v ? argv.v : false;
var workingPath = projectPath;

events.subscribe('ERROR', showError);
events.subscribe('VERBOSE', showVerbose);
events.subscribe('WARNING', tools.showWarning);
events.subscribe('STEP', tools.showStep);
events.subscribe('MESSAGE', tools.showMessage);

checkUserInput();


function checkUserInput(){

    var promisesPack = [];

    if(argv._[0] === 'init' || argv._[0] === 'docker' || argv._[0] === 'pack' || argv._[0] === 'deploy' || argv._[0] === 'rollback' || argv._[0] === 'provision'){

        promisesPack.push(
            [tools.config, [env, argv.f]],
            [tools.createBaseEnvironment, [projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile]]
        );

        if(env !== 'local') {
            promisesPack.push(
                [tools.param, ['ssh', 'enable', true]],
                [promises.cond, [
                    [tools.param, ['ssh', 'workingpath'], 'working-path'],
                    [tools.param, ['ssh', 'host'], 'host'],
                    [tools.param, ['ssh', 'port'], 'port'],
                    [tools.param, ['ssh', 'username'], 'user-name'],
                    [tools.param, ['ssh', 'key'], 'key'],
                    [tools.param, ['ssh', 'passphrase'], 'passphrase'],
                    [setWorkingPath, '::working-path::'],
                    [ssh.connect, ['::host::', '::port::', '::user-name::', '::key::', '::passphrase::']]
                ]] // last param autofilled
            );
        }

        promisesPack.push(
            eval(argv._[0])
        );

        promises.add(promisesPack);
        promises.start();
    }
}

function deploy(){

    var promisesPack = [];

    promisesPack.push(
        [tools.param, ['git', 'branchdevel'], 'branch-devel'],
        [tools.param, ['git', 'branchdeploy'], 'branch-deploy'],
        [tools.param, ['project', 'srcin'], 'srcin'],

        [tools.runFileCommands, commonPath + '/' + env + '-before.sh'],
        [cross.config, projectPath],
        [git.config, projectPath],
        [git.initRepo, gorillaFolder],
        [git.currentBranch, null, 'current-branch'],
        [git.add, '.'],
        git.stash
    );

    if (argv.all) {
        promisesPack.push(
            [git.createBranch, ['::branch-deploy::', true]],
            [git.listCommits, ['::branch-deploy::', '']],
            [tools.selectArrayValue, 'last'], // last param autofilled
            [git.commitDate, '::branch-deploy::', 'last-commit-date'], // last param autofilled
            [git.listFiles, ['::last-commit-date::', null, '::branch-deploy::'], 'list'],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [cross.removeFiles, [workingPath, true, null]], // last param autofilled
            [tools.fusionObjectNodes, ['added', 'modified', '::list::']],
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }else if (argv.n) {
        promisesPack.push(
            // Los archivos eliminados los tengo que recuperar de la rama de desarrollo y contar desde la fecha del último commit de la rama deploy.
            [git.createBranch, ['::branch-deploy::', true]],
            [git.commitDate, ['::branch-deploy::'], 'last-commit-date'],
            [git.listFiles, ['::last-commit-date::', null, '::branch-devel::']],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [tools.filterPaths, '::srcin::', 'list-devel-filtered'], // last param autofilled
            [cross.removeFiles, [workingPath, true, null, '::list-devel-filtered::']],
            [cross.removeFiles, [projectPath + '/', false, null, '::list-devel-filtered::']],

            [git.commit, ['GorillaJS rollback ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
            [git.clone, ['file://' + projectPath, '::branch-devel::', projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/' + '::srcin::']],
            [tools.removeDir, projectPath + '/temp_repo/'],

            //Los archivos añadidos o modificados los recupero de la rama deploy.
            [git.add, '.'],
            [git.commit, ['GorillaJS deploy ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
            [git.listFiles, ['::last-commit-date::', null, '::branch-deploy::']],
            [tools.fusionObjectNodes, ['added', 'modified']], // last param autofilled
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }else{
        promisesPack.push(
            // Los archivos eliminados, añadido y modificados los recupero del último commit de la rama deploy.
            [git.createBranch, ['::branch-deploy::', true]],
            [git.commitDate, ['::branch-deploy::', null], 'last-commit-date'],
            [git.listFiles, ['::last-commit-date::', null, '::branch-deploy::'], 'list'],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [cross.removeFiles, [workingPath, true, null]], // last param autofilled
            [tools.fusionObjectNodes, ['added', 'modified', '::list::']],
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }

    promisesPack.push(
        [git.createBranch, '::current-branch::'],
        [git.stash, 'pop'],
        [tools.runFileCommands, commonPath + '/' + env + '-after.sh'],
        ssh.close
    );

    promises.add(promisesPack);
    promises.start();
}

function rollback(){

    var promisesPack = [
        [git.config, projectPath],
        [git.initRepo, gorillaFolder],
        [git.currentBranch, null, 'current-branch'],
        [git.add, '.'],
        git.stash,

        [git.createBranch, [tools.param('git', 'branchdeploy')]],
        [git.listCommits, [tools.param('git', 'branchdeploy'), 'rollback'], 'commits'],
        [tools.param, ['git', 'rollbackdate', '::commits', null, false], 'rollback-point'],
        [git.commitDate, [tools.param('git', 'branchdeploy')], 'commit-date'], // last param autofilled
        [git.listFiles, ['::commit-date', datef(new Date(), 'yyyy-mm-dd HH:MM:ss o'), tools.param('git', 'branchdeploy'), true], 'list'],

        // [Aquí hago un reset --hard al commit inicial para recuperar todos los archivos],
        [git.reset, [tools.param('git', 'branchdeploy'), '::rollback-point']],
        [tools.fusionObjectNodes, ['deleted', 'modified', '::list']],
        [cross.moveFiles, [workingPath + '/' + tools.param('project', 'srcout'), true]], // last param autofilled

        // Como voy hacia atrás en el tiempo, los archivos eliminados ahora son añadidos y a la inversa.
        [tools.fusionObjectNodes, ['added', null, '::list'], 'list-deleted'],
        [cross.removeFiles, [workingPath + '/' + tools.param('project', 'srcout'), true, null, '::list-deleted']],
        [cross.removeFiles, [projectPath + '/', false, null, 'promises:list-deleted']],

        [git.listCommits, [tools.param('git', 'branchdeploy'), 'deploy']],
        [tools.selectArrayValue, 0], // last param autofilled
        [git.reset, [tools.param('git', 'branchdeploy')]], // last param autofilled

        [git.createBranch, '::current-branch'],
        [git.stash, 'pop'],
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

function showVerbose(systemMessage, force){
    if(verbose || force){
        tools.showVerbose(systemMessage);
    }
}

function showError(number){
    tools.showError(number);
    tools.showStep('gorilla-cleaner');
    events.unsubscribe('VERBOSE', showVerbose);
    events.unsubscribe('WARNING', tools.showWarning);
    events.unsubscribe('STEP', tools.showStep);
    events.unsubscribe('MESSAGE', tools.showMessage);
    cleanBeforeForceExit();
}

function cleanBeforeForceExit(){

    var promisesPack = [];

    if(argv._[0] === 'rollback' || argv._[0] === 'deploy'){
        promisesPack.push(
            [git.config, projectPath],
            [git.initRepo, gorillaFolder],
            [git.createBranch, '::current-branch'],
            [git.stash, 'pop']
        );
    }

    promises.add(promisesPack);
    promises.add(process.exit);
    promises.start();
}

function setWorkingPath(path){
    workingPath = path;
       
    return path;
}
