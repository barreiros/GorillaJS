'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var events = require(__dirname + '/../lib/pubsub.js');
var cross = require(__dirname + '/../lib/crossExec.js');
var tools = require(__dirname + '/../lib/tools.js');
var promises = require(__dirname + '/../lib/promises.js');
var pty = require('pty.js');
var stdin = process.openStdin();

events.subscribe('INIT_PLUGINS', init);
events.subscribe('MODIFY_COMPOSE_BY_django_PLUGIN', modifyComposeFile);

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

function modifyComposeFile(gorillaFile, templatePath){

    var settings, folder, promisesPack;

    settings = JSON.parse(fs.readFileSync(gorillaFile));

    promisesPack = [

        [tools.param, ['django', 'database', ['SQLite', 'PostgreSQL', 'MySQL']], 'engine'],
        [configureEngine, [templatePath, '{{engine}}']]

    ];
    promises.sandwich(promisesPack);

}

function configureEngine(templatePath, engine){

    var data;

    if(engine === 'PostgreSQL'){

        data = fs.readFileSync(templatePath + '/docker-compose-postgresql.yml');
        fsx.removeSync(templatePath + '/mysql-init.conf');

    }else if(engine === 'MySQL'){

        data = fs.readFileSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/postgresql-init.conf');

    }

    fs.appendFileSync(templatePath + '/docker-compose.yml', data);

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

