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

var gorillaPath = __dirname;
var gorillaFolder = '.gorilla';
var gorillaFile = 'gorillafile';
var messagesFile = 'messages';
var projectPath = process.cwd();
var templatesPath = gorillaPath + '/templates';
var composeFile = 'docker-compose.yml';
var env = argv.e ? argv.e : 'local';
var verbose = argv.v ? argv.v : false;
var workingPath;


events.subscribe('PROMISEME', function(){
    tools.promiseme();
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


if(argv._[0] === 'init' || argv._[0] === 'pack' || argv._[0] === 'start' || argv._[0] === 'provision'){

    tools.config(env);
    tools.createBaseEnvironment(projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile);

    if(env !== 'local') {
        if(tools.param('ssh', 'enable', ['yes', 'no']) === 'yes'){
            tools.promises().push([ssh.connect, [
                tools.param('ssh', 'identifytype', ['key', 'password']), 
                tools.param('ssh', 'host'), 
                tools.param('ssh', 'port'), 
                tools.param('ssh', 'username'), 
                tools.param('ssh', 'identifytype') === 'key' ? tools.param('ssh', 'key') : tools.param('ssh', 'password'),
                tools.param('ssh', 'identifytype') === 'key' ? tools.param('ssh', 'passphrase') : null
            ]]);
            workingPath = tools.param('ssh', 'workingpath') + '/' + tools.param('project', 'slug', null, tools.sanitize);
        }
    }else{
        workingPath = projectPath;
    }

    tools.promises().push(
        tools.getPlatform,
        eval(argv._[0])
    );

    tools.promiseme();
}

function init(){

    if (argv.c || argv.r) {
        tools.promises().push(
            [git.config, workingPath]
        );
    }

    if (argv.c) {
        tools.promises().push(
            git.initRepo,
            [git.clone, [tools.param('git', 'clonefromurl'), tools.param('git', 'clonefrombranch'), projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/temp_repo/', projectPath + '/', false, ['.git']]],
            [tools.removeDir, projectPath + '/temp_repo/']
        );
    }

    if (argv.r) {
        tools.promises().push(
            git.initRepo,
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : tools.param('git', 'token')), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug', null, tools.sanitize)]],
            [git.addOrigin, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), tools.param('project', 'slug'), workingPath]],
            [git.createBranch, tools.param('git', 'branchdevel')],
            [git.add, '.'],
            [git.commit, 'GorillaJS ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss')], 
            [git.push, tools.param('git', 'branchdevel')]
        );
    }

    if (argv.d) {
        tools.createTemplateEnvironment(projectPath, templatesPath, tools.param('docker', 'template'), gorillaFolder, gorillaFile, messagesFile);
        tools.promises().push([tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']);

        if (ssh.get()) {
            tools.promises().push([cross.moveFiles, [projectPath + '/' + gorillaFolder, workingPath + '/' + gorillaFolder, true, ['.DS_Store']]]);
        }

        tools.promises().push(
            [docker.config, tools.getPlatform()],
            [docker.check, tools.param('docker', 'machinename')],
            [docker.start, [tools.param('docker', 'machinename'), workingPath + '/' + gorillaFolder + '/' + composeFile, tools.param('project', 'domain')]]
            // [tools.resetEnvVariables, projectPath + '/' + gorillaFolder + '/**/*']
        );

        if (ssh.get()){
            if(tools.param('system', 'platform', ['apache', 'nginx', 'cancel']) !== 'cancel'){
                tools.promises().push(
                    [host.create, [tools.param('system', 'platform'), projectPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', workingPath + '/' + gorillaFolder + '/' + tools.param('system', 'platform') + '-proxy.conf', tools.param('project', 'domain')]],
                    [host.open, ['http://' + tools.param('project', 'domain'), 15, 'Waiting for opening your web']]
                );
            }else{
                tools.promises().push(
                    [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
                );
            }
        }else{
            if(tools.param('hosts', 'enabled', ['yes', 'no']) === 'yes'){
                tools.promises().push(
                    [host.add, [tools.param('system', 'hostsfile'), tools.param('project', 'domain'), docker.ip(tools.param('docker', 'machinename'))]],
                    [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
                );
            }else{
                tools.promises().push([host.open, ['http://' + docker.ip(tools.param('docker', 'machinename')) + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]);
            }
        }
        if (ssh.get()) tools.promises().push(ssh.close);
    }

    if (tools.promises().length) tools.promiseme();
}

function pack(){

    if (argv.f) tools.setConfigFile(f);

    tools.promises().push(
        [git.createBranch, 'gorilla-master'],
        git.reset,
        [git.clone, tools.param('git', 'mainrepo')],
        [tools.moveFiles, [__dirname + '/temp_repo/' + tools.param('project', 'serverfolder'), __dirname + '/', ['.git']]],
        [tools.removeDir, __dirname + '/temp_repo/'],
        [git.checkout, 'gorilla-master'], 
        [git.add, '.'],
        [git.commit, 'deploy ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss')], 
        [git.push, 'master'], 
        [git.checkout, 'gorilla-devel']
    );

    if (tools.promises().length) tools.promiseme();
}

function provision(){
    
    tools.promises().push(
        [tools.provision, [projectPath + '/' + gorillaFolder + '/remote-provision.sh']],
        // ssh.interactive,
        [ssh.close]
    );

    if (tools.promises().length) tools.promiseme();
}

function start(){

    if (tools.promises().length) tools.promiseme();
}
