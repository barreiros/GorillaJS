#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var exec = require('child_process').exec;
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');
var mkdirp = require('mkdirp');

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
var gorillaTemplateFolder = 'template';
var gorillaFile = 'gorillafile';
var messagesFile = 'messages';
var projectPath = process.cwd();
var commonPath = projectPath + '/' + gorillaFolder + '/common';
var workingPath = projectPath;
var templatesPath = gorillaPath + '/templates';
var composeFile = 'docker-compose.yml';
var env = argv.e ? argv.e : 'local';
var verbose = argv.v ? argv.v : false;
var templateOptions = ['wordpress', 'other'];

events.subscribe('ERROR', showError);
events.subscribe('VERBOSE', showVerbose);
events.subscribe('WARNING', tools.showWarning);
events.subscribe('STEP', tools.showStep);
events.subscribe('MESSAGE', tools.showMessage);

checkUserInput();


function checkUserInput(){

    var promisesPack = [];

    if(argv._[0] === 'init' || argv._[0] === 'docker' || argv._[0] === 'pack' || argv._[0] === 'deploy' || argv._[0] === 'rollback' || argv._[0] === 'provision'){

        if(argv._[0] && argv._[1]){
            mkdirp.sync(argv._[1]);
            projectPath = argv._[1];
            commonPath = projectPath + '/' + gorillaFolder + '/common';
            workingPath = projectPath;
        }

        promisesPack.push(
            [tools.config, [env, argv.f]],
            [tools.createBaseEnvironment, [projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile]]
        );

        if(env !== 'local') {
            promisesPack.push(
                [tools.param, ['ssh', 'enable', true], 'ssh-enabled'],
                [promises.cond, '{{ssh-enabled}}', [
                    [tools.param, ['ssh', 'workingpath'], 'working-path'],
                    [tools.param, ['ssh', 'host'], 'host'],
                    [tools.param, ['ssh', 'port'], 'ssh-port'],
                    [tools.param, ['ssh', 'username'], 'user-name'],
                    [tools.param, ['ssh', 'key'], 'key'],
                    [tools.param, ['ssh', 'passphrase'], 'passphrase'],
                    [setWorkingPath, '{{working-path}}'],
                    [ssh.connect, ['{{host}}', '{{ssh-port}}', '{{user-name}}', '{{key}}', '{{passphrase}}']]
                ]]
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
            [git.createBranch, ['{{branch-deploy}}', true]],
            [git.listCommits, ['{{branch-deploy}}', '']],
            [tools.selectArrayValue, 'last'], // last param autofilled
            [git.commitDate, '{{branch-deploy}}', 'last-commit-date'], // last param autofilled
            [git.listFiles, ['{{last-commit-date}}', null, '{{branch-deploy}}'], 'list'],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [cross.removeFiles, [workingPath, true, null]], // last param autofilled
            [tools.fusionObjectNodes, ['added', 'modified', '{{list}}']],
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }else if (argv.n) {
        promisesPack.push(
            // Los archivos eliminados los tengo que recuperar de la rama de desarrollo y contar desde la fecha del último commit de la rama deploy.
            [git.createBranch, ['{{branch-deploy}}', true]],
            [git.commitDate, ['{{branch-deploy}}'], 'last-commit-date'],
            [git.listFiles, ['{{last-commit-date}}', null, '{{branch-devel}}']],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [tools.filterPaths, '{{srcin}}', 'list-devel-filtered'], // last param autofilled
            [cross.removeFiles, [workingPath, true, null, '{{list-devel-filtered}}']],
            [cross.removeFiles, [projectPath + '/', false, null, '{{list-devel-filtered}}']],

            [git.commit, ['GorillaJS rollback ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
            [git.clone, ['file://' + projectPath, '{{branch-devel}}', projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/', false, ['.git'], projectPath + '/temp_repo/' + '{{srcin}}']],
            [tools.removeDir, projectPath + '/temp_repo/'],

            //Los archivos añadidos o modificados los recupero de la rama deploy.
            [git.add, '.'],
            [git.commit, ['GorillaJS deploy ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
            [git.listFiles, ['{{last-commit-date}}', null, '{{branch-deploy}}']],
            [tools.fusionObjectNodes, ['added', 'modified']], // last param autofilled
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }else{
        promisesPack.push(
            // Los archivos eliminados, añadido y modificados los recupero del último commit de la rama deploy.
            [git.createBranch, ['{{branch-deploy}}', true]],
            [git.commitDate, ['{{branch-deploy}}', null], 'last-commit-date'],
            [git.listFiles, ['{{last-commit-date}}', null, '{{branch-deploy}}'], 'list'],
            [tools.fusionObjectNodes, ['deleted', null]], // last param autofilled
            [cross.removeFiles, [workingPath, true, null]], // last param autofilled
            [tools.fusionObjectNodes, ['added', 'modified', '{{list}}']],
            [cross.moveFiles, [workingPath, true]] // last param autofilled
        );
    }

    promisesPack.push(
        [git.createBranch, '{{current-branch}}'],
        [git.stash, 'pop'],
        [tools.runFileCommands, commonPath + '/' + env + '-after.sh'],
        ssh.close
    );

    promises.add(promisesPack);
    promises.start();
}

function rollback(){

    var promisesPack = [];

    promisesPack = [
        [tools.param, ['git', 'branchdeploy'], 'branch-deploy'],

        [git.config, projectPath],
        [git.initRepo, gorillaFolder],
        [git.currentBranch, null, 'current-branch'],
        [git.add, '.'],
        git.stash,

        [git.createBranch, '{{branch-deploy}}'],
        [git.listCommits, ['{{branch-deploy}}', 'rollback'], 'commits'],
        [tools.param, ['git', 'rollbackdate', '{{commits}}', null, false], 'rollback-point'],
        [git.commitDate, '{{branch-deploy}}', 'commit-date'], // last param autofilled
        [git.listFiles, ['{{commit-date}}', datef(new Date(), 'yyyy-mm-dd HH:MM:ss o'), '{{branch-deploy}}', true], 'list'],

        // [Aquí hago un reset --hard al commit inicial para recuperar todos los archivos],
        [git.reset, ['{{branch-deploy}}', '{{rollback-point}}']],
        [tools.fusionObjectNodes, ['deleted', 'modified', '{{list}}']],
        [cross.moveFiles, [workingPath, true]], // last param autofilled

        // Como voy hacia atrás en el tiempo, los archivos eliminados ahora son añadidos y a la inversa.
        [tools.fusionObjectNodes, ['added', null, '{{list}}'], 'list-deleted'],
        [cross.removeFiles, [workingPath, true, null, '{{list-deleted}}']],
        [cross.removeFiles, [projectPath + '/', false, null, '{{list-deleted}}']],

        [git.listCommits, ['{{branch-deploy}}', 'deploy']],
        [tools.selectArrayValue, 0], // last param autofilled
        [git.reset, '{{branch-deploy}}'], // last param autofilled

        [git.createBranch, '{{current-branch}}'],
        [git.stash, 'pop'],
        ssh.close
    ];

    promises.add(promisesPack);
    promises.start();
}

function docker(){

    var promisesPack = [];

    promisesPack = [
        [tools.paramForced, ['docker', 'gorillafolder', gorillaFolder]],
        [tools.paramForced, ['docker', 'templatefolder', gorillaTemplateFolder]],
        [tools.param, ['docker', 'template', templateOptions], 'template'],
        [tools.checkTemplatePath, [templateOptions, '{{template}}', templatesPath], 'template-path'],
        [cross.moveFiles, [projectPath + '/' + gorillaFolder + '/' + gorillaTemplateFolder, false, ['.DS_Store'], '{{template-path}}']],
        [tools.createTemplateEnvironment, [projectPath, gorillaFolder, gorillaFile, messagesFile, gorillaTemplateFolder]],
        [tools.param, ['docker', 'machinename'], 'machine-name'],
        [tools.param, ['docker', 'port'], 'port'],
        [tools.param, ['project', 'slug', null, tools.sanitize], 'slug'],

        [tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/' + gorillaTemplateFolder + '/*'],

        [promises.cond, '{{ssh-enabled}}', [
            [cross.moveFiles, [workingPath + '/' + gorillaFolder, true, ['.DS_Store'], projectPath + '/' + gorillaFolder]]
        ]],

        [tools.getPlatform],
        [m_docker.config],
        [m_docker.check, ['{{machine-name}}', '{{ssh-enabled}}']],
        [m_docker.start, ['{{machine-name}}', workingPath + '/' + gorillaFolder + '/' + gorillaTemplateFolder + '/' + composeFile, '{{slug}}', '{{ssh-enabled}}']],

        [promises.cond, '{{ssh-enabled}}', [
            [tools.param, ['project', 'domain'], 'domain'],
            [tools.param, ['system', 'platform', ['apache', 'nginx', 'none'], 'management']],
            [promises.cond, '{{management}}::none', [
                [host.open, ['http://{{domain}}' + ':' + '{{port}}', 15, 'Waiting for opening your web']]
            ], [
                [host.create, ['{{management}}', projectPath + '/' + gorillaFolder + '/{{management}}-proxy.conf', workingPath + '/' + gorillaFolder + '/{{management}}-proxy.conf', '{{domain}}']],
                [host.open, ['http://{{domain}}' , 3, 'Waiting for opening your web']]
            ]]
        ], [
            [tools.param, ['host', 'enabled', ['ip', 'domain']], 'host-enabled'],
            [promises.cond, '{{host-enabled}}::domain', [
                [m_docker.ip, '{{machine-name}}', 'ip'],
                [tools.param, ['project', 'domain'], 'domain'],
                [tools.param, ['system', 'hostsfile'], 'hosts-file'],
                [host.add, ['{{hosts-file}}', '{{domain}}', '{{ip}}']],
                [host.open, ['http://{{domain}}' + ':' + '{{port}}', 3, 'Waiting for opening your web']]
            ], [
                [m_docker.ip, '{{machine-name}}', 'ip'],
                [tools.paramForced, ['project', 'domain', '{{ip}}']],
                [host.open, ['http://{{ip}}:{{port}}', 3, 'Waiting for opening your web']]
            ]]
        ]],

        [promises.cond, '{{ssh-enabled}}', [ssh.close]],
    ];

    promises.add(promisesPack);
    promises.start();
}

function exit(text){
    console.log(text);
    events.publish('PROMISEME');
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
            [git.createBranch, '{{current-branch}}'],
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
