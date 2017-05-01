/**
 * Plugin name: HTML5
 * 
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

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

    if(fs.existsSync(gorillaFile)){

    }else{

        events.publish('ERROR', ['030']);

    }

}

function setTemplate(name){

    template = name;

}

function modifyComposeFileBefore(gorillaFile, templatePath){

    var settings, folder, promisesPack;

    if(template === 'HTML5'){

        settings = JSON.parse(fs.readFileSync(gorillaFile));

        promisesPack = [

            [events.publish, ['STEP', ['html5_database_config']]],
            [tools.param, ['database', 'engine', ['No, thanks!', 'MySQL', 'PostgreSQL', 'MongoDB']], 'engine'],
            [configureEngine, [templatePath, '{{engine}}']]

        ];
        promises.sandwich(promisesPack);

    }
    
}

function modifyComposeFileAfter(gorillaFile, templatePath){

    if(template === 'HTML5'){

        appendEngine(gorillaFile, templatePath);

    }

}

function configureEngine(templatePath, engine){

    if(engine === 'PostgreSQL'){

        fsx.removeSync(templatePath + '/mysql-init.conf');
        fsx.removeSync(templatePath + '/mysql-debian.cnf');
        fsx.removeSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/apache-checkdb.php');

        fsx.removeSync(templatePath + '/mongo-init.conf');
        fsx.removeSync(templatePath + '/mongo-service');
        fsx.removeSync(templatePath + '/mongod.conf');

    }else if(engine === 'MySQL'){

        fsx.removeSync(templatePath + '/postgresql-init.conf');
        fsx.removeSync(templatePath + '/postgresql.conf');
        fsx.removeSync(templatePath + '/docker-compose-postgresql.yml');

        fsx.removeSync(templatePath + '/mongo-init.conf');
        fsx.removeSync(templatePath + '/mongo-service');
        fsx.removeSync(templatePath + '/mongod.conf');

    }else if(engine === 'MongoDB'){

        fsx.removeSync(templatePath + '/mysql-init.conf');
        fsx.removeSync(templatePath + '/mysql-debian.cnf');
        fsx.removeSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/apache-checkdb.php');

        fsx.removeSync(templatePath + '/postgresql-init.conf');
        fsx.removeSync(templatePath + '/postgresql.conf');
        fsx.removeSync(templatePath + '/docker-compose-postgresql.yml');

    }else{

        fsx.removeSync(templatePath + '/mysql-init.conf');
        fsx.removeSync(templatePath + '/mysql-debian.cnf');
        fsx.removeSync(templatePath + '/docker-compose-mysql.yml');
        fsx.removeSync(templatePath + '/apache-checkdb.php');

        fsx.removeSync(templatePath + '/postgresql-init.conf');
        fsx.removeSync(templatePath + '/postgresql.conf');
        fsx.removeSync(templatePath + '/docker-compose-postgresql.yml');

        fsx.removeSync(templatePath + '/mongo-init.conf');
        fsx.removeSync(templatePath + '/mongo-service');
        fsx.removeSync(templatePath + '/mongod.conf');
        fsx.removeSync(templatePath + '/docker-compose-mongo.yml');

    }

    events.publish('PROMISEME');

}

function appendEngine(gorillaFile, templatePath){

    var settings, links, composeFile, engineFile;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = templatePath + '/docker-compose.yml';

    if(settings.local.database.engine === 'PostgreSQL'){

        engineFile = templatePath + '/docker-compose-postgresql.yml';
        yaml.load(engineFile, function(fileEngine){

            yaml.load(composeFile, function(fileWeb){

                fileWeb.services['postgresql'] = fileEngine.services.postgresql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6));

            });

        });

    }else if(settings.local.database.engine === 'MySQL'){

        engineFile = templatePath + '/docker-compose-mysql.yml';
        yaml.load(engineFile, function(fileEngine){

            yaml.load(composeFile, function(fileWeb){

                fileWeb.services['mysql'] = fileEngine.services.mysql;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6));

            });

        });

    }else if(settings.local.database.engine === 'MongoDB'){

        engineFile = templatePath + '/docker-compose-mongo.yml';
        yaml.load(engineFile, function(fileEngine){

            yaml.load(composeFile, function(fileWeb){

                fileWeb.services['mongo'] = fileEngine.services.mongo;
                fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6));

            });

        });

    }

    events.publish('PROMISEME');

}
