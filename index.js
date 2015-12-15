#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var exec = require('child_process').exec;
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');

var tools, host, events, docker, git;
var verbose = false;
var env = 'local';
var gorillaPath = __dirname;
var gorillaFolder = '.gorilla';
var gorillaFile = 'gorillafile';
var projectPath = process.cwd();
var templatesPath = gorillaPath + '/templates';
var composeFile = 'docker-compose.yml';

if(argv.e) env = argv.e;
if(argv.v) verbose = true;

tools = require(__dirname + '/lib/tools.js')(env);
host = require(__dirname + '/lib/host.js');
events = require(__dirname + '/lib/pubsub.js');
docker = require(__dirname + '/lib/docker.js');
git = require(__dirname + '/lib/git.js');

events.subscribe('PROMISEME', function(){
    tools.promiseme();
});
events.subscribe('VERBOSE', function(systemMessage){
    if(verbose){
        console.log(systemMessage);
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

if(argv._[0] === 'init' || argv._[0] === 'pack' || argv._[0] === 'start'){
    tools.createBaseEnvironment(projectPath, gorillaFile, gorillaFolder);
    eval(argv._[0])();
}

function init(){

    if (argv.f) tools.setConfigFile(argv.f);

    if (argv.grc) tools.promises().push(
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'username') : tools.param('git', 'token')), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : true), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug')]],
            [git.initRepo, [tools.param('git', 'mainrepo'), projectPath]],
            [git.createBranch, 'gorilla-devel'], 
            [git.clone, tools.param('git', 'clonefrom')],
            [tools.moveFiles, [__dirname + '/temp_repo/', __dirname + '/', ['.git']]],
            [tools.removeDir, __dirname + '/temp_repo/'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'gorilla-devel']
        );
    else if (argv.gr) tools.promises().push(
            [git.createRemote, [tools.param('git', 'platform', ['github', 'bitbucket', 'gitlab']), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'username') : tools.param('git', 'token')), (tools.param('git', 'platform') !== 'gitlab' ? tools.param('git', 'password') : true), tools.param('git', 'private', ['true', 'false']), tools.param('project', 'slug')]],
            [git.initRepo, [tools.param('git', 'mainrepo'), projectPath]],
            [git.createBranch, 'gorilla-devel'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'gorilla-devel']
        );
    else if (argv.g) tools.promises().push(
            [git.initRepo, [tools.param('git', 'mainrepo'), projectPath]],
            [git.createBranch, 'gorilla-devel'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'gorilla-devel']
        );

    if (argv.d) tools.promises().push(
            [tools.createDockerEnvironment, [projectPath, templatesPath, gorillaFile, projectPath + '/' + gorillaFolder]], // If not exist.
            [tools.moveFiles, [templatesPath + '/' + tools.param('docker', 'template'), projectPath + '/' + gorillaFolder]],
            [tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/**/*'],
            [docker.check, tools.param('docker', 'machinename')],
            [docker.start, [tools.param('docker', 'machinename'), projectPath + '/' + gorillaFolder + '/' + composeFile, tools.param('apache', 'vhosturl')]],
            [host.open, ['http://' + tools.param('apache', 'vhosturl') + ':' + tools.param('apache', 'port'), 15, 'Waiting for opening your web:']]
        );

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

function start(){

    if (tools.promises().length) tools.promiseme();
}
