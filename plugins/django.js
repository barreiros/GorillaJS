'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(__dirname + '/../lib/pubsub.js');
var cross = require(__dirname + '/../lib/crossExec.js');
var tools = require(__dirname + '/../lib/tools.js');
var promises = require(__dirname + '/../lib/promises.js');
var pty = require('pty.js');
var stdin = process.openStdin();

events.subscribe('INIT_PLUGINS', init);
events.subscribe('MODIFY_BEFORE_SET_VARIABLES_django_PLUGIN', modifyComposeFileBefore);
events.subscribe('MODIFY_AFTER_SET_VARIABLES_django_PLUGIN', modifyComposeFileAfter);

function init(gorillaFile){

    var argTail, data;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.local.docker.template === 'django'){

            if(argv._[0] === 'django'){

                argTail = process.argv.slice(4).join(' ');

                if(argv._[1] === 'manage'){

                    manageDjango(data.local, argTail);

                }

            }

        }

    }else{

        events.publish('ERROR', ['030']);

    }

}

function modifyComposeFileBefore(gorillaFile, templatePath){

    var settings, folder, promisesPack;

    settings = JSON.parse(fs.readFileSync(gorillaFile));

    promisesPack = [

        [tools.param, ['django', 'database', ['SQLite', 'PostgreSQL', 'MySQL']], 'engine'],
        [configureEngine, [templatePath, '{{engine}}']]

    ];
    promises.sandwich(promisesPack);

}

function modifyComposeFileAfter(gorillaFile, templatePath){

    appendEngine(gorillaFile, templatePath);

}

function configureEngine(templatePath, engine){

    if(engine === 'PostgreSQL'){

        fsx.removeSync(templatePath + '/mysql-init.conf');

    }else if(engine === 'MySQL'){

        fsx.removeSync(templatePath + '/postgresql-init.conf');

    }

    events.publish('PROMISEME');

}

function appendEngine(gorillaFile, templatePath){

    var settings, links, composeFile, engineFile;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = templatePath + '/docker-compose.yml';

    if(settings.local.django.database === 'PostgreSQL'){

        engineFile = templatePath + '/docker-compose-postgresql.yml';
        yaml.load(engineFile, function(fileEngine){

            yaml.load(composeFile, function(fileWeb){

                fileWeb.services['postgresql'] = fileEngine.services.postgresql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6));

            });

        });

    }else if(settings.local.django.database === 'MySQL'){

        engineFile = templatePath + '/docker-compose-mysql.yml';
        yaml.load(engineFile, function(fileEngine){

            yaml.load(composeFile, function(fileWeb){

                fileWeb.services['mysql'] = fileEngine.services.mysql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6));

            });

        });

    }

    events.publish('PROMISEME');

}

function manageDjango(data, command){

    var term = pty.spawn('docker', ['exec', '-it', data.project.domain, './var/www/' + data.project.domain + '/manage.py', command], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    term.on('data', function(data) {

        process.stdout.write(data);

    });

    term.on('close', function(code) {
        
        process.exit();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

