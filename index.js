#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');
var mkdirp = require('mkdirp');
var paths = require('path');

var tools = require(__dirname + '/lib/tools.js');
var events = require(__dirname + '/lib/pubsub.js');
var ssh = require(__dirname + '/lib/ssh.js');
var m_docker = require(__dirname + '/lib/docker.js');
var git = require(__dirname + '/lib/git.js');
var host = require(__dirname + '/lib/host.js');
var cross = require(__dirname + '/lib/crossExec.js');
var promises = require(__dirname + '/lib/promises.js');

var pluginWordpress = require(__dirname + '/plugins/wordpress.js');

var gorillaPath = __dirname;
var gorillaFolder = '.gorilla';
var gorillaTemplateFolder = 'template';
var gorillaFile = 'gorillafile';
var messagesFile = 'messages';
var projectPath = process.cwd();
var homeUserPath = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library' : '/var/local'));
var hostsFile = process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
var commonPath = paths.join(projectPath, gorillaFolder, 'common');
var workingPath = projectPath;
var templatesPath = paths.join(gorillaPath, 'templates');
var composeFile = 'docker-compose.yml';
var proxyName = 'gorillajs';
var proxyHost = 'localhost';
var proxyPort = 80;
var env = argv.e ? argv.e : 'local';
var verbose = argv.d ? argv.d : false;
var templateOptions = ['wordpress', 'blank', 'blank+database', 'other'];

events.subscribe('ERROR', showError);
events.subscribe('VERBOSE', showVerbose);
events.subscribe('WARNING', tools.showWarning);
events.subscribe('STEP', tools.showStep);
events.subscribe('MESSAGE', tools.showMessage);
events.subscribe('ANSWER', tools.answer);

checkUserInput();

module.exports = {
    
    init: initFromApp,
    events: events

}

function checkUserInput(){

    var promisesPack = [];

    if(argv._[0] === 'init'){

        if(argv._[0] && argv._[1]){

            mkdirp.sync(argv._[1]);
            projectPath = argv._[1];
            commonPath = paths.join(projectPath, gorillaFolder, 'common');
            workingPath = projectPath;

        }

        if(argv.hasOwnProperty('f')){

            promisesPack.push(
                [tools.force, [paths.join(projectPath, gorillaFolder, gorillaFile)], 'old-domain'],
                [tools.removeDir, paths.join(projectPath, gorillaFolder)]
            );

        }

        if(argv.hasOwnProperty('p')){

            proxyPort = argv.p;

        }

    }

    promisesPack.push(
        [tools.printLogo],
        [tools.config, env],
        [tools.createBaseEnvironment, [projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile]],
        [events.publish, ['INIT_PLUGINS', paths.join(projectPath, gorillaFolder, gorillaFile)], true]
    );

    if(argv._[0] === 'init'){

        promisesPack.push(
            eval(argv._[0])
        );

    }

    promises.add(promisesPack);
    promises.start();

}

function initFromApp(path){

    var promisesPack = [];

    promisesPack.push(
        [tools.printLogo],
        [tools.config, [env]],
        [tools.createBaseEnvironment, [projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile]],
        [init]
    );

    promises.add(promisesPack);
    promises.start();

}

function init(){

    var promisesPack = [];

    promisesPack = [

        [tools.paramForced, ['docker', 'gorillafolder', gorillaFolder]],
        [tools.paramForced, ['docker', 'templatefolder', gorillaTemplateFolder]],
        [tools.param, ['docker', 'template', templateOptions], 'template'],
        [tools.checkTemplatePath, [templateOptions, '{{template}}', templatesPath], 'template-path'],
        [cross.moveFiles, [paths.join(projectPath, gorillaFolder, gorillaTemplateFolder), false, ['.DS_Store'], '{{template-path}}']],
        [tools.createTemplateEnvironment, [projectPath, gorillaFolder, gorillaFile, messagesFile, gorillaTemplateFolder]],
        [tools.param, ['docker', 'port'], 'port'],


        [promises.cond, '{{ssh-enabled}}', [

            [cross.moveFiles, [paths.join(workingPath, gorillaFolder), true, ['.DS_Store'], paths.join(projectPath, gorillaFolder)]]

        ]],
        [m_docker.config],

        [promises.cond, '{{ssh-enabled}}', [

            [tools.param, ['project', 'domain'], 'domain'],
            [tools.sanitize, '{{domain}}', 'slug'],
            [tools.paramForced, ['project', 'slug', '{{slug}}']],
            [tools.param, ['system', 'platform', ['apache', 'nginx', 'none'], 'management']],
            [promises.cond, '{{management}}::none', [

                [host.open, ['http://{{domain}}' + ':' + '{{port}}', 15, 'Waiting for opening your web']]

            ], [

                [host.create, ['{{management}}', paths.join(projectPath, gorillaFolder, '{{management}}-proxy.conf'), paths.join(workingPath, gorillaFolder, '{{management}}-proxy.conf'), '{{domain}}']],
                [host.open, ['http://{{domain}}' , 3, 'Waiting for opening your web']]

            ]],

            [tools.setEnvVariables, paths.join(projectPath, gorillaFolder, gorillaTemplateFolder, '*')]

        ], [

            [tools.param, ['project', 'domain'], 'domain'],
            [tools.sanitize, '{{domain}}', 'slug'],
            [tools.paramForced, ['project', 'slug', '{{slug}}']],
            [tools.paramForced, ['proxy', 'userpath', homeUserPath + '/' +  proxyName]],
            [tools.paramForced, ['proxy', 'port', proxyPort], 'proxyport'],
            [tools.paramForced, ['proxy', 'host', proxyHost]],
            [tools.paramForced, ['system', 'hostsfile', hostsFile], 'hosts-file'],
            [cross.moveFiles, [paths.join(homeUserPath, proxyName, 'template'), false, ['.DS_Store'], paths.join(templatesPath, 'proxy')]],

            [tools.setEnvVariables, paths.join(homeUserPath, proxyName, 'template', '*')],
            [tools.setEnvVariables, paths.join(projectPath, gorillaFolder, gorillaTemplateFolder, '*')],

            [m_docker.ip, '{{machine-name}}', 'ip'],

            [promises.cond, '{{old-domain}}!:""', [
                [tools.sanitize, '{{old-domain}}', 'old-slug'],
                [m_docker.removeSite, [paths.join(homeUserPath, proxyName, ''), '{{old-domain}}', '{{old-slug}}']]
            ]],

            [m_docker.start, ['{{machine-name}}', paths.join(workingPath, gorillaFolder, gorillaTemplateFolder, composeFile), '{{slug}}', '{{ssh-enabled}}']],
            [m_docker.checkContainers, [paths.join(homeUserPath, proxyName, gorillaTemplateFolder, composeFile)]],
            [m_docker.base, [proxyPort, paths.join(homeUserPath, proxyName, gorillaTemplateFolder, composeFile), proxyName]],

            [host.add, ['{{hosts-file}}', '{{domain}}', '{{ip}}']],
            [promises.cond, 'proxyport::80', [
                [host.open, ['http://{{domain}}', 3, 'Waiting for opening your web']]
            ], [
                [host.open, ['http://{{domain}}:{{proxyport}}', 3, 'Waiting for opening your web']]
            ]],

        ]],

        [promises.cond, '{{ssh-enabled}}', [ssh.close]]

    ];

    promises.add(promisesPack);
    promises.start();
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

function exit(text){
    console.log(text);
    events.publish('PROMISEME');
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
