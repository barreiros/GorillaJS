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
var paths = require('path');

var tools = require(__dirname + '/lib/tools.js');
var events = require(__dirname + '/lib/pubsub.js');
var ssh = require(__dirname + '/lib/ssh.js');
var m_docker = require(__dirname + '/lib/docker.js');
var git = require(__dirname + '/lib/git.js');
var host = require(__dirname + '/lib/host.js');
var cross = require(__dirname + '/lib/crossExec.js');
var promises = require(__dirname + '/lib/promises.js');

var pluginProxy = require(__dirname + '/plugins/proxy.js');
var pluginBlank = require(__dirname + '/plugins/blank.js');
var pluginDjango = require(__dirname + '/plugins/django.js');
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
var composeFile = 'docker-compose.yml';
var proxyName = 'gorillajs';
var proxyHost = 'localhost';
var proxyPort = 80;
var proxySslPort = 443;
var logsPort = 3001;
var env = argv.e ? argv.e : 'local';
var verbose = argv.d ? argv.d : false;
var templateOptions = ['Blank', 'Django', 'NodeJS', 'Opencart', 'Wordpress', 'External repository', 'Local folder'];
var templateRepos = {
    'django': 'https://github.com/barreiros/GorillaJS-Django.git',
    'proxy': 'https://github.com/barreiros/GorillaJS-Proxy',
    'wordpress': 'https://github.com/barreiros/GorillaJS-Wordpress'
};

events.subscribe('ERROR', showError);
events.subscribe('VERBOSE', showVerbose);
events.subscribe('WARNING', tools.showWarning);
events.subscribe('STEP', tools.showStep);
events.subscribe('MESSAGE', tools.showMessage);
events.subscribe('ANSWER', tools.answer);

checkUserInput();

function checkUserInput(){

    var promisesPack = [];

    if((argv.hasOwnProperty('v') || argv.hasOwnProperty('version')) && argv._.length === 0){

        console.log(tools.printVersion());

    }else if((argv.hasOwnProperty('h') || argv.hasOwnProperty('help')) && argv._.length === 0){

        var text;

        text = '';
        text += 'Usage:';
        text += '\n';
        text += '\tgorilla init [parameters](optional)\n';
        text += '\n';
        text += 'Parameters:';
        text += '\n';
        text += '\t-d Enable debug / verbose mode';
        text += '\n';
        text += '\t-f Force to recreate the project (This action don\'t remove your current project files)';
        text += '\n';
        text += '\t-p Select a custom port for the GorillaJS proxy. By default it use 80. If this port is used by other application i.e Apache, GorillaJS will return error.';
        text += '\n';
        text += '\t-v Get the GorillaJS version';
        text += '\n';

        console.log(text);

    }else{

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
            [tools.createBaseEnvironment, [projectPath, paths.join(homeUserPath, proxyName, 'templates'), gorillaPath, paths.join(homeUserPath, proxyName), gorillaFile, gorillaFolder, messagesFile]],
            [events.publish, ['INIT_PLUGINS', paths.join(projectPath, gorillaFolder, gorillaFile)], true]
        );

        if(argv._[0] === 'init'){

            promisesPack.push(
                eval(argv._[0])
            );

        }

    }

    promises.add(promisesPack);
    promises.start();

}

function init(){

    var promisesPack = [];

    promisesPack = [

        [tools.paramForced, ['docker', 'gorillafolder', gorillaFolder]],
        [tools.param, ['docker', 'template-type', templateOptions], 'template-type'],

        [promises.cond, '{{template-type}}::Local folder', [
        
            [tools.param, ['docker', 'template-folder'], 'template']

        ], [
        
            [promises.cond, '{{template-type}}::External repository', [

                [tools.param, ['docker', 'template-repository'], 'template']

            ], [

                [tools.sanitize, ['{{template-type}}', ''], 'template-type'],
                [tools.selectObjectValue, [templateRepos, '{{template-type}}'], 'template']
            
            ]],

        ]],

        [tools.basename, ['{{template}}'], 'template-basename'],
        [tools.sanitize, ['{{template-basename}}', '-'], 'template-slug'],
        [tools.paramForced, ['docker', 'template-path', paths.join(homeUserPath, proxyName, 'templates', '{{template-slug}}')], 'template-path'],
        [tools.paramForced, ['docker', 'template-slug', '{{template-slug}}']],
        [tools.paramForced, ['docker', 'template', '{{template}}']],

        [m_docker.check],
        [m_docker.config],
        [m_docker.gorigit, [paths.join(homeUserPath, proxyName, 'templates')]],
        [m_docker.templates, [templateRepos.proxy, '/var/gorillajs/templates/gorillajs-proxy']],

        [promises.cond, '{{template-type}}::Local folder', [

            [cross.moveFiles, ['{{template-path}}', false, ['.DS_Store', '.git'], '{{template}}']]

        ], [

            [m_docker.templates, ['{{template}}', '/var/gorillajs/templates/{{template-slug}}']]

        ]],

        [cross.moveFiles, [paths.join(projectPath, gorillaFolder, gorillaTemplateFolder), false, ['.DS_Store', 'project', '.git'], '{{template-path}}']],
        [tools.createTemplateEnvironment, [projectPath, gorillaFolder, gorillaFile, messagesFile, gorillaTemplateFolder]],

        [tools.param, ['docker', 'port'], 'port'],
        [tools.param, ['project', 'domain'], 'domain'],
        [tools.sanitize, ['{{domain}}', ''], 'slug'],
        [tools.isLocalProject, '{{domain}}', 'islocal'],
        [tools.paramForced, ['project', 'islocal', '{{islocal}}']],
        [tools.paramForced, ['project', 'slug', '{{slug}}']],

        [tools.param, ['project', 'sslenable', ['yes', 'no']], 'sslenable'],

        [promises.cond, '{{sslenable}}::yes', [

            [tools.paramForced, ['project', 'protocol', 'https'], 'protocol'],
            [promises.cond, '{{islocal}}::yes', [

                [tools.paramForced, ['project', 'sslemail', false]]

            ], [

                [tools.param, ['project', 'sslemail'], 'sslemail']

            ]]

        ], [

            [tools.paramForced, ['project', 'sslemail', false]],
            [tools.paramForced, ['project', 'protocol', 'http'], 'protocol']

        ]],

        [tools.paramForced, ['proxy', 'userpath', homeUserPath + '/' +  proxyName]],
        [tools.paramForced, ['proxy', 'port', proxyPort], 'proxyport'],
        [tools.paramForced, ['proxy', 'sslport', proxySslPort], 'proxysslport'],
        [tools.paramForced, ['proxy', 'host', proxyHost]],
        [tools.paramForced, ['logs', 'port', logsPort], 'logsPort'],
        [tools.paramForced, ['system', 'hostsfile', hostsFile], 'hosts-file'],

        [cross.moveFiles, [paths.join(homeUserPath, proxyName, 'proxy'), false, ['.DS_Store', '.git'], paths.join(homeUserPath, proxyName, 'templates', 'gorillajs-proxy')]],

        [events.publish, ['MODIFY_BEFORE_SET_VARIABLES_{{template-type}}_PLUGIN', [paths.join(projectPath, gorillaFolder, gorillaFile), paths.join(projectPath, gorillaFolder, gorillaTemplateFolder)]], true],
        [events.publish, ['CONFIGURE_PROXY', [paths.join(projectPath, gorillaFolder, gorillaFile), paths.join(workingPath, gorillaFolder), paths.join(projectPath, gorillaFolder, gorillaTemplateFolder), paths.join(homeUserPath, proxyName, 'templates', 'proxy'), paths.join(homeUserPath, proxyName)]], true],

        [host.createSSHKeys, paths.join(projectPath, gorillaFolder, gorillaTemplateFolder)],
        [tools.setEnvVariables, paths.join(homeUserPath, proxyName, 'proxy', '*')],
        [tools.setEnvVariables, paths.join(projectPath, gorillaFolder, gorillaTemplateFolder, '*')],

        [events.publish, ['MODIFY_AFTER_SET_VARIABLES_{{template-type}}_PLUGIN', [paths.join(projectPath, gorillaFolder, gorillaFile), paths.join(projectPath, gorillaFolder, gorillaTemplateFolder)]], true],

        [m_docker.ip, '{{machine-name}}', 'ip'],

        [promises.cond, '{{old-domain}}!:""', [

            [tools.sanitize, ['{{old-domain}}', ''], 'old-slug'],
            [m_docker.removeSite, [paths.join(homeUserPath, proxyName, ''), '{{old-domain}}', '{{old-slug}}']]

        ]],

        [m_docker.network],
        [m_docker.start, ['{{machine-name}}', paths.join(workingPath, gorillaFolder, gorillaTemplateFolder, composeFile), '{{slug}}', '{{ssh-enabled}}']],
        [m_docker.base, [paths.join(homeUserPath, proxyName, 'proxy', composeFile), proxyName, '{{proxyport}}']],
        [m_docker.logging, [paths.join(workingPath, gorillaFolder, gorillaTemplateFolder, composeFile), '{{domain}}', paths.join(homeUserPath, proxyName, 'logs'), paths.join(homeUserPath, proxyName, 'templates', 'proxy')]],
        [m_docker.logging, [paths.join(homeUserPath, proxyName, 'proxy', composeFile), proxyName, paths.join(homeUserPath, proxyName, 'logs'), paths.join(homeUserPath, proxyName, 'templates', 'proxy')]],

        [promises.cond, '{{islocal}}::yes', [

            [host.add, ['{{hosts-file}}', '{{domain}}', '{{ip}}']],

            [promises.cond, '{{proxyport}}::80', [

                [host.check, ['{{protocol}}://{{domain}}']],
                [host.open, ['{{protocol}}://{{domain}}', 'Your project is ready!']]

            ], [

                [host.check, ['{{protocol}}://{{domain}}']],
                [host.open, ['{{protocol}}://{{domain}}:{{proxyport}}', 'Your project is ready!']]

            ]]

        ]]

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

function setWorkingPath(path){
    workingPath = path;
       
    return path;
}
