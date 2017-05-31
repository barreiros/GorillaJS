/**
 * Plugin name: Django
 * 
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');
var pty = require('pty.js');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));

var template = '';

events.subscribe('INIT_PLUGINS', init);
events.subscribe('TEMPLATE_SELECTED', setTemplate);
events.subscribe('BEFORE_SET_TEMPLATE_VARIABLES', modifyComposeFileBefore);
events.subscribe('AFTER_SET_TEMPLATE_VARIABLES', modifyComposeFileAfter);

function init(gorillaFile){

    var argTail, data;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.local.hasOwnProperty('docker')){

            if(data.local.docker.template_type === 'Django'){

                if(argv._[0] === 'django'){

                    argTail = process.argv.slice(4).join(' ');

                    if(argv._[1] === 'manage'){

                        manageDjango(data.local, argTail);

                    }

                }else if(argv._[0] === 'pip'){

                    if(argv._[1] === 'save'){

                        saveRequirements(data.local);

                    }else{

                        argTail = process.argv.slice(3).join(' ');

                        managePip(data.local, argTail);

                    }

                }

            }

        }

    }

}


function setTemplate(name){

    template = name;

}

function saveRequirements(data){

    cross.exec('docker exec -i ' + data.project.domain + ' pip freeze > src/requirements.txt', function(err, stdout, stderr){

        if (err) console.log(stderr, err, stdout);

    });

}

function managePip(data, args){

    var stdin, term, command;

    command = ['exec', '-it', data.project.domain, 'pip'].concat(args.split(" "));
    stdin = process.openStdin();

    term = pty.spawn('docker', command, {
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
        process.stdin.destroy();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

function manageDjango(data, command){

    var stdin, term;

    stdin = process.openStdin();
    term = pty.spawn('docker', ['exec', '-it', data.project.domain, './var/www/' + data.project.domain + '/manage.py', command], {
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
        process.stdin.destroy();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

function modifyComposeFileBefore(gorillaFile, templatePath){

    var settings, folder, promisesPack;

    if(template == 'Django'){

        settings = JSON.parse(fs.readFileSync(gorillaFile));

        promisesPack = [

            [tools.param, ['database', 'engine', ['SQLite', 'PostgreSQL', 'MySQL']], 'engine'],
            [tools.param, ['cache', 'engine', ['No, thanks!', 'Redis', 'Memcached']], 'cache'],
            [tools.param, ['messages', 'engine', ['no', 'yes']], 'messages'],
            [events.publish, ['STEP', ['django_database_config']]],
            [configureEngine, [templatePath, '{{engine}}']],
            [events.publish, ['STEP', ['django_cache_config']]],
            [configureCache, [templatePath, '{{cache}}']],
            [configureMessages, templatePath]

        ];
        promises.sandwich(promisesPack);

    }

}


function configureEngine(templatePath, engine){

    if(engine === 'PostgreSQL'){

        fsx.removeSync(templatePath + '/mysql-init.conf');
        fsx.removeSync(templatePath + '/mysql-debian.cnf');
        fsx.removeSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/settings-mysql');
        fsx.removeSync(templatePath + '/settings-sqlite');

    }else if(engine === 'MySQL'){

        fsx.removeSync(templatePath + '/postgresql-init.conf');
        fsx.removeSync(templatePath + '/postgresql.conf');
        fsx.removeSync(templatePath + '/docker-compose-postgresql.yml');
        fsx.removeSync(templatePath + '/settings-postgresql');
        fsx.removeSync(templatePath + '/settings-sqlite');

    }else{

        fsx.removeSync(templatePath + '/mysql-init.conf');
        fsx.removeSync(templatePath + '/mysql-debian.cnf');
        fsx.removeSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/settings-postgresql');
        
        fsx.removeSync(templatePath + '/postgresql-init.conf');
        fsx.removeSync(templatePath + '/postgresql.conf');
        fsx.removeSync(templatePath + '/docker-compose-postgresql.yml');
        fsx.removeSync(templatePath + '/settings-mysql');

    }

    events.publish('PROMISEME');

}

function configureCache(templatePath, engine){

    if(engine === 'Redis'){

        fsx.removeSync(templatePath + '/settings-memcached');

    }else if(engine === 'Memcached'){

        fsx.removeSync(templatePath + '/redis.conf');
        fsx.removeSync(templatePath + '/settings-redis');
        fsx.removeSync(templatePath + '/docker-compose-redis.yml');

    }else{

        fsx.removeSync(templatePath + '/redis.conf');
        fsx.removeSync(templatePath + '/settings-redis');
        fsx.removeSync(templatePath + '/settings-memcached');
        fsx.removeSync(templatePath + '/docker-compose-redis.yml');

    }

    events.publish('PROMISEME');

}

function configureMessages(templatePath, response){

    if(response === 'no'){

        fsx.removeSync(templatePath + '/docker-compose-rabbitmq.yml');
        fsx.removeSync(templatePath + '/settings-rabbitmq');

    }

    events.publish('PROMISEME');

}

function modifyComposeFileAfter(gorillaFile, templatePath){

    var settings, promisesPack;

    if(template == 'Django'){

        settings = JSON.parse(fs.readFileSync(gorillaFile));

        promisesPack = [

            [checkDatabaseEngine, [gorillaFile, templatePath]],
            [checkCacheEngine, [gorillaFile, templatePath]],
            [checkMessageEngine, [gorillaFile, templatePath]]

        ];
        promises.sandwich(promisesPack);

    }

}

function checkDatabaseEngine(gorillaFile, templatePath){

    var settings, links, composeFile, engineFile;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = templatePath + '/docker-compose.yml';

    yaml.load(composeFile, function(fileWeb){

        if(settings.local.database.engine === 'PostgreSQL'){

            engineFile = templatePath + '/docker-compose-postgresql.yml';
            yaml.load(engineFile, function(fileEngine){

                fileWeb.services['postgresql'] = fileEngine.services.postgresql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 

                events.publish('PROMISEME');

            });

        }else if(settings.local.database.engine === 'MySQL'){

            engineFile = templatePath + '/docker-compose-mysql.yml';
            yaml.load(engineFile, function(fileEngine){

                fileWeb.services['mysql'] = fileEngine.services.mysql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 

                events.publish('PROMISEME');

            });

        }else{

            events.publish('PROMISEME');

        }

    });

}

function checkCacheEngine(gorillaFile, templatePath){

    var settings, links, composeFile, engineFile;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = templatePath + '/docker-compose.yml';

    yaml.load(composeFile, function(fileWeb){

        if(settings.local.cache.engine === 'Redis'){

            engineFile = templatePath + '/docker-compose-redis.yml';
            yaml.load(engineFile, function(fileEngine){

                fileWeb.services['redis'] = fileEngine.services.redis;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 

                events.publish('PROMISEME');

            });

        }else{

            events.publish('PROMISEME');

        }

    });

}

function checkMessageEngine(gorillaFile, templatePath){

    var settings, links, composeFile, engineFile;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = templatePath + '/docker-compose.yml';

    yaml.load(composeFile, function(fileWeb){

        if(settings.local.messages.engine === 'yes'){

            engineFile = templatePath + '/docker-compose-rabbitmq.yml';
            yaml.load(engineFile, function(fileEngine){

                fileWeb.services['rabbitmq'] = fileEngine.services.rabbitmq;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 

                events.publish('PROMISEME');

            });

        }else{

            events.publish('PROMISEME');

        }

    });

}

