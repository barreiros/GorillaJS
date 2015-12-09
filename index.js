#! /usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var exec = require('child_process').exec;
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');

var tools, host, events, docker, git;
var env = 'local';
var gorillaPath = __dirname;
var gorillaFolder = '.gorilla';
var gorillaFile = 'gorillafile';
var projectPath = process.cwd();
var templatesPath = gorillaPath + '/templates';
var composeFile = 'docker-compose.yml';


if(argv.e) env = argv.e;

tools = require(__dirname + '/lib/tools.js')(env);
host = require(__dirname + '/lib/host.js');
events = require(__dirname + '/lib/pubsub.js');
docker = require(__dirname + '/lib/docker.js');
git = require(__dirname + '/lib/git.js');

events.subscribe('PROMISEME', function(){
    tools.promiseme();
});

tools.createGorillaEnvironment(
    projectPath, 
    templatesPath,
    gorillaFile,
    projectPath + '/' + gorillaFolder
); // If not exist.

if(argv._[0] === 'configure' || argv._[0] === 'pack' || argv._[0] === 'start'){
    eval(argv._[0])();
}

function configure(){

    if (argv.f) tools.setConfigFile(argv.f);

    if (argv.a) tools.promises().push('create-vhost');

    if (argv.d) {

        tools.promises().push(
            [tools.moveFiles, [templatesPath + '/' + tools.param('docker', 'template'), projectPath + '/' + gorillaFolder]],
            [tools.setEnvVariables, projectPath + '/' + gorillaFolder + '/**/*'],
            [docker.check, tools.param('docker', 'machinename')],
            [docker.start, [tools.param('docker', 'machinename'), projectPath + '/' + gorillaFolder + '/' + composeFile, tools.param('apache', 'vhosturl')]],
            [host.open, ['http://' + tools.param('apache', 'vhosturl') + ':' + tools.param('apache', 'port'), 7]]
        );
    }

    if (argv.l) tools.promises().push(
            git.initRepo, 
            [git.createBranch, 'devel'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'devel']
        );
    else if (argv.lr) tools.promises().push(
            git.createRemote, 
            git.initRepo, 
            [git.createBranch, 'devel'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'devel']
        );
    else if (argv.lrc) tools.promises().push(
            git.createRemote, 
            git.initRepo, 
            [git.createBranch, 'devel'], 
            [git.clone, tools.param('git', 'clonefrom')],
            [tools.moveFiles, [__dirname + '/temp_repo/', __dirname + '/', ['.git']]],
            [tools.removeDir, __dirname + '/temp_repo/'],
            [git.add, '.'],
            [git.commit, 'Initial commit'], 
            [git.push, 'devel']
        );

    if (tools.promises().length) tools.promiseme();
}

function pack(){

    if (argv.f) tools.setConfigFile(f);

    tools.promises().push(
        [git.createBranch, 'master'],
        git.reset,
        [git.clone, tools.param('git', 'mainrepo')],
        [tools.moveFiles, [__dirname + '/temp_repo/' + tools.param('project', 'serverfolder'), __dirname + '/', ['.git']]],
        [tools.removeDir, __dirname + '/temp_repo/'],
        [git.checkout, 'master'], 
        [git.add, '.'],
        [git.commit, 'deploy ' + datef(new Date(), 'yyyy-mm-dd HH:MM:ss')], 
        [git.push, 'master'], 
        [git.checkout, 'devel']
    );

    if (tools.promises().length) tools.promiseme();
}

function start(){

    if (tools.promises().length) tools.promiseme();
}
