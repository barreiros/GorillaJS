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


if(argv._[0] === 'init' || argv._[0] === 'pack' || argv._[0] === 'deploy' || argv._[0] === 'rollback' || argv._[0] === 'provision'){

    tools.config(env);
    tools.createBaseEnvironment(projectPath, templatesPath, gorillaPath, gorillaFile, gorillaFolder, messagesFile);

    if(env !== 'local') {
        if(tools.param('ssh', 'enable', ['yes', 'no']) === 'yes'){
            tools.promises().push([ssh.connect, [
                tools.param('ssh', 'host'), 
                tools.param('ssh', 'port'), 
                tools.param('ssh', 'username'), 
                tools.param('ssh', 'key'),
                tools.param('ssh', 'passphrase')
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

function deploy(){
    // git show --name-only --oneline --no-commit-id --pretty="format:"
    // Falta aplicar el filtro git-diff (https://git-scm.com/docs/git-diff) para saber si son modificados, eliminados, añadidos... Esto lo voy a necesitar, sobre todo, en el método de rollback.

}

function rollback(){

}

function pack(){

    if (argv.f) tools.setConfigFile(f);

    tools.promises().push(
        [git.config, workingPath],
        [git.initRepo, gorillaFolder],
        [git.createBranch, tools.param('git', 'branchdevel')],
        [git.add, '.'],
        [git.commit, ['GorillaJS control point ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]],
        [git.createBranch, [tools.param('git', 'branchdeploy'), true]],
        [git.clone, ['file://' + projectPath, tools.param('git', 'branchdevel'), projectPath + '/temp_repo/']],
        [cross.moveFiles, [projectPath + '/temp_repo/' + tools.param('project', 'src'), projectPath + '/', false, ['.git']]],
        [tools.removeDir, projectPath + '/temp_repo/'],
        [git.add, '.'],
        [git.commit, 'GorillaJS deploy point ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss')],
        [git.checkout, tools.param('git', 'branchdevel')]
    );

    if (tools.promises().length) tools.promiseme();
}

function init(){

    if (argv.c || argv.r) {
        tools.promises().push(
            [git.config, workingPath]
        );
    }

    if (argv.c) {
        tools.promises().push(
            [git.config, workingPath],
            [git.initRepo, gorillaFolder],
            [git.clone, [tools.param('git', 'clonefromurl'), tools.param('git', 'clonefrombranch'), projectPath + '/temp_repo/']],
            [cross.moveFiles, [projectPath + '/temp_repo/', projectPath + '/', false, ['.git']]],
            [tools.removeDir, projectPath + '/temp_repo/'],
            [git.createBranch, tools.param('git', 'branchdevel')],
            [git.commit, ['GorillaJS has cloned the repo ' + tools.param('git', 'clonefromurl') + ' on ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss'), true]]
        );
    }

    if (argv.r) {
        tools.promises().push(
            [git.config, workingPath],
            [git.initRepo, gorillaFolder],
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : tools.param('git', 'token')), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug', null, tools.sanitize)]],
            [git.addOrigin, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), tools.param('git', 'username'), tools.param('project', 'slug'), workingPath]]
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
            [docker.start, [tools.param('docker', 'machinename'), workingPath + '/' + gorillaFolder + '/' + composeFile, tools.param('project', 'slug', null, tools.sanitize)]]
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
            if(tools.param('hosts', 'enabled', ['ip', 'domain']) === 'domain'){
                tools.promises().push(
                    [host.add, [tools.param('system', 'hostsfile'), tools.param('project', 'domain'), docker.ip(tools.param('docker', 'machinename'))]],
                    [host.open, ['http://' + tools.param('project', 'domain') + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]
                );
            }else{
                tools.paramForced('project', 'domain', docker.ip(tools.param('docker', 'machinename')));
                tools.promises().push([host.open, ['http://' + docker.ip(tools.param('docker', 'machinename')) + ':' + tools.param('docker', 'port'), 15, 'Waiting for opening your web']]);
            }
        }
        if (ssh.get()) tools.promises().push(ssh.close);
    }

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
