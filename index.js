#! /usr/bin/env node

/****** 
 
    MIT License

    Copyright (c) 2016 GorillaJS

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

******/


'use strict';

var argv = require('minimist')(process.argv.slice(2));
var prompt = require('readline-sync');
var color = require('colors');
var datef = require('dateformat');
var mkdirp = require('mkdirp');
var path = require('path');
var uuid = require('uuid/v4');

global.envPaths = {

    'base': __dirname,
    'libraries': path.join(__dirname, 'lib'),
    'plugins': path.join(__dirname, 'plugins')

}

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var m_docker = require(path.join(envPaths.libraries, 'docker.js'));
var host = require(path.join(envPaths.libraries, 'host.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));
var plugins = require(path.join(envPaths.libraries, 'plugins.js'));
var credentials = require(path.join(envPaths.libraries, 'login.js'));

var gorillaPath = variables.gorillaPath;
var gorillaFolder = variables.gorillaFolder;
var gorillaTemplateFolder = variables.gorillaTemplateFolder;
var gorillaFile = variables.gorillaFile;
var messagesFile = variables.messagesFile;
var projectPath = variables.projectPath;
var homeUserPath = variables.homeUserPath;
var hostsFile = variables.hostsFile;
var commonPath = variables.commonPath;
var workingPath = variables.workingPath;
var composeFile = variables.composeFile;
var proxyName = variables.proxyName;
var proxyHost = variables.proxyHost;
var env = variables.env;
var verbose = variables.verbose;
var templateOptions = variables.templateOptions;
var templateRepos = variables.templateRepos;

events.subscribe('ERROR', showError);
events.subscribe('VERBOSE', showVerbose);
events.subscribe('WARNING', tools.showWarning);
events.subscribe('STEP', tools.showStep);
events.subscribe('MESSAGE', tools.showMessage);
events.subscribe('ANSWER', tools.answer);

checkUserInput();

function checkUserInput(){

    var promisesPack = [];

    if(projectPath === gorillaPath){

        events.publish('ERROR', ['000']);

    }else{

        if((argv.hasOwnProperty('v') || argv.hasOwnProperty('version')) && argv._.length === 0){

            console.log(tools.printVersion());

        }else if((argv.hasOwnProperty('h') || argv.hasOwnProperty('help')) && argv._.length === 0){

            console.log('Please, visit https://gorillajs.com');

        }else{

            promisesPack.push(

                [plugins.include]

            );

            if(argv._[0] === 'build'){

                promisesPack.push([tools.printLogo]);

                if(argv._[0] && argv._[1]){

                    projectPath = path.resolve(argv._[1]);
                    mkdirp.sync(projectPath);
                    variables.projectPath = projectPath;
                    commonPath = path.join(projectPath, gorillaFolder, 'common');
                    workingPath = projectPath;
                    variables.workingPath = workingPath;

                }


                if(argv.hasOwnProperty('f')){

                    promisesPack.push(
                        [m_docker.stop, [path.join(projectPath, gorillaFolder, gorillaFile)]],
                        [tools.force, [path.join(projectPath, gorillaFolder, gorillaFile)]]
                    );

                }

                if(argv.hasOwnProperty('p')){

                    proxyPort = argv.p;

                }

                promisesPack.push(

                    [tools.config, env],
                    [tools.isNewProject, path.join(workingPath, gorillaFolder, gorillaFile), 'new-project'],

                    [m_docker.check],
                    [m_docker.config],
                    [m_docker.getTemplateSource, [path.join(homeUserPath, proxyName, 'templates'), templateRepos.proxy, 'gorillajs-proxy']],

                    [tools.createGorillaFile, [path.join(projectPath, gorillaFolder, gorillaFile), gorillaFolder], 'id'],
                    [promises.cond, '{{id}}!:', [

                        [tools.paramForced, ['project', 'id', uuid()]]

                    ], [
                    
                        [tools.paramForced, ['project', 'id', '{{id}}']]

                    ]],
                    [tools.retrieveConfigData, [path.join(homeUserPath, proxyName), 'gorillajs-proxy']],
                    [tools.retrieveConfigData, [path.join(homeUserPath, proxyName), 'overwrite']],
                    [build]

                );

            }else if(argv._[0] === 'run'){

                promisesPack.push([tools.printLogo]);

                if(argv._[0] && argv._[1]){

                    projectPath = path.resolve(argv._[1]);
                    variables.projectPath = projectPath;
                    workingPath = projectPath;
                    variables.workingPath = workingPath;

                }

                promisesPack.push(

                    [tools.config, env],
                    [tools.createGorillaFile, [path.join(projectPath, gorillaFolder, gorillaFile), gorillaFolder], 'id'],
                    [run]

                );

            }else if(argv._[0] === 'login'){

                promisesPack.push(

                    [credentials.login, [argv._[1], argv._[2]]]

                );

            }else if(argv._[0] === 'logout'){

                promisesPack.push(

                    credentials.logout

                );

            }

            promisesPack.push(

                [events.publish, ['INIT_PLUGINS', path.join(projectPath, gorillaFolder, gorillaFile)], true]

            );


        }

        promises.add(promisesPack);
        promises.start();

    }

}

function run(){

    var promisesPack = [];

    promisesPack = [

        [tools.param, ['project', 'domain'], 'domain'],
        [tools.sanitize, ['{{domain}}', ''], 'slug'],

        [commit.replace],
        [m_docker.startSimple, [path.join(workingPath, gorillaFolder, gorillaTemplateFolder, composeFile), '{{slug}}']],
        [m_docker.startSimple, [path.join(homeUserPath, proxyName, 'proxy', 'template', composeFile), proxyName]],

        [events.publish, ['STEP', ['Your project is ready!']]]

    ];

    promises.add(promisesPack);
    promises.start();

}

function build(){

    var promisesPack = [];

    promisesPack = [

        [events.publish, ['STEP', ['starting']]],
        [tools.paramForced, ['docker', 'gorillafolder', gorillaFolder]],
        [tools.param, ['docker', 'template_type', templateOptions], 'template_type'],
        [events.publish, ['TEMPLATE_SELECTED', '{{template_type}}'], true],

        [events.publish, ['STEP', ['check_repo']]],
        [promises.cond, '{{template_type}}::Local folder', [
        
            [tools.param, ['docker', 'template-folder'], 'template']

        ], [
        
            [promises.cond, '{{template_type}}::External repository', [

                [tools.param, ['docker', 'template_repository'], 'template']

            ], [

                [tools.sanitize, ['{{template_type}}', ''], 'template_type'],
                [tools.selectObjectValue, [templateRepos, '{{template_type}}'], 'template']
            
            ]],

        ]],

        [tools.basename, ['{{template}}'], 'template_basename'],
        [tools.sanitize, ['{{template_basename}}', '-'], 'template_slug'],
        [tools.paramForced, ['docker', 'data_path', path.join(homeUserPath, proxyName, 'data')], 'data_path'],
        [tools.paramForced, ['docker', 'template_path', path.join(homeUserPath, proxyName, 'templates', '{{template_slug}}')], 'template_path'],
        [tools.paramForced, ['docker', 'template_slug', '{{template_slug}}']],
        [tools.paramForced, ['docker', 'template', '{{template}}']],

        [promises.cond, '{{template_type}}::Local folder', [

            [cross.moveFiles, ['{{template_path}}', false, ['.DS_Store', '.git'], '{{template}}']]

        ], [

            [m_docker.getTemplateSource, [path.join(homeUserPath, proxyName, 'templates'), '{{template}}', '{{template_slug}}']]

        ]],

        [promises.cond, '{{new-project}}::yes', [

            [cross.moveFiles, [projectPath, false, ['.DS_Store', '.git'], path.join('{{template_path}}', 'project')]]

        ]],

        [tools.paramForced, ['docker', 'port', Math.floor(Math.random() * (4999 - 4700)) + 4700], 'dockerport'],
        // [cross.moveFiles, [path.join(projectPath, gorillaFolder, gorillaTemplateFolder), false, ['.DS_Store', 'project', '.git'], '{{template_path}}']],
        // [cross.moveFiles, [path.join(projectPath, gorillaFolder, gorillaTemplateFolder), false, ['.DS_Store', 'project', '.git'], path.join(envPaths.base, 'templates', 'Django')]],
        [cross.moveFiles, [path.join(projectPath, gorillaFolder, gorillaTemplateFolder), false, ['.DS_Store', 'project', '.git'], path.join(envPaths.base, 'templates', 'Wordpress')]],
        [tools.retrieveConfigData, [path.join(homeUserPath, proxyName), '{{template_slug}}']],

        [events.publish, ['STEP', ['check_domain']]],
        [tools.param, ['project', 'domain'], 'domain'],
        [tools.sanitize, ['{{domain}}', ''], 'slug'],
        [tools.isLocalProject, '{{domain}}', 'islocal'],
        [tools.paramForced, ['project', 'protocol', 'http'], 'protocol'],
        [tools.paramForced, ['project', 'islocal', '{{islocal}}']],
        [tools.paramForced, ['project', 'slug', '{{slug}}']],

        [events.publish, ['DOMAIN_SELECTED', '{{domain}}'], true],

        [tools.param, ['proxy', 'port'], 'proxyport'],
        [tools.param, ['proxy', 'host'], 'proxyhost'],
        [tools.paramForced, ['system', 'hostsfile', hostsFile], 'hosts-file'],
        [tools.paramForced, ['proxy', 'userpath', path.join(homeUserPath, proxyName, 'proxy')]],

        [events.publish, ['STEP', ['move_files']]],

        [cross.moveFiles, [path.join(homeUserPath, proxyName, 'proxy', 'template'), false, ['.DS_Store', '.git'], path.join(homeUserPath, proxyName, 'templates', 'gorillajs-proxy')]],

        [events.publish, ['STEP', ['config_plugins']]],

        [events.publish, ['BEFORE_SET_PROXY_VARIABLES', [path.join(projectPath, gorillaFolder, gorillaFile), path.join(homeUserPath, proxyName, 'proxy', 'template')]], true],
        [tools.setEnvVariables, path.join(homeUserPath, proxyName, 'proxy', 'template', '*')],
        [events.publish, ['AFTER_SET_PROXY_VARIABLES', [path.join(projectPath, gorillaFolder, gorillaFile), path.join(homeUserPath, proxyName, 'proxy', 'template')]], true],

        [events.publish, ['BEFORE_SET_TEMPLATE_VARIABLES', [path.join(projectPath, gorillaFolder, gorillaFile), path.join(projectPath, gorillaFolder, gorillaTemplateFolder)]], true],
        [tools.setEnvVariables, [path.join(projectPath, gorillaFolder, gorillaTemplateFolder, '*'), ['image']]],
        [events.publish, ['AFTER_SET_TEMPLATE_VARIABLES', [path.join(projectPath, gorillaFolder, gorillaFile), path.join(projectPath, gorillaFolder, gorillaTemplateFolder)]], true],

        [m_docker.ip, '{{machine-name}}', 'ip'],

        [events.publish, ['STEP', ['docker_start']]],
        [m_docker.network],
        [commit.replace],
        [m_docker.stop, [path.join(projectPath, gorillaFolder, gorillaFile)]],
        [m_docker.start, ['{{machine-name}}', path.join(workingPath, gorillaFolder, gorillaTemplateFolder, composeFile), '{{slug}}', '{{ssh-enabled}}']],
        [m_docker.stop, [null, 'gorillajsproxy']],
        [m_docker.base, [path.join(homeUserPath, proxyName, 'proxy', 'template', composeFile), proxyName, '{{proxyport}}']],
        [events.publish, ['DOCKER_STARTED'], true],
        [tools.fusion, [path.join(projectPath, gorillaFolder, gorillaFile)]],

        [promises.cond, '{{islocal}}::yes', [

            [host.add, ['{{hosts-file}}', '{{domain}}', '{{ip}}']],

            [promises.cond, '{{proxyport}}::80', [

                [host.check, ['{{protocol}}://{{domain}}']],
                [host.open, '{{protocol}}://{{domain}}'],
                [events.publish, ['MESSAGE', ['Server ready!!!']], true]

            ], [

                [host.check, ['{{protocol}}://{{domain}}']],
                [host.open, '{{protocol}}://{{domain}}:{{proxyport}}'],
                [events.publish, ['MESSAGE', ['Server ready!!!']], true]

            ]],

            [events.publish, ['STEP', ['open_project']]]

        ], [
        
            [events.publish, ['STEP', ['build_project']]]

        ]],
        [host.check, ['{{protocol}}://{{domain}}', true]],
        [events.publish, ['STEP', ['project_dependencies']]],
        [events.publish, ['PROJECT_COMPLETED'], true]

    ];

    promises.add(promisesPack);
    promises.start();

}

function exit(text){
    console.log(text);
    events.publish('PROMISEME');
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

    process.exit();

}
