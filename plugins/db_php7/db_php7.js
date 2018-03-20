/**
 * Plugin name: DB for PHP7 projects
 * 
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));

var template = '';

events.subscribe('INIT_PLUGINS', init);
events.subscribe('TEMPLATE_SELECTED', setTemplate);
events.subscribe('BEFORE_SET_TEMPLATE_VARIABLES', modifyComposeFileBefore);
events.subscribe('AFTER_SET_TEMPLATE_VARIABLES', modifyComposeFileAfter);
events.subscribe('DOCKER_STARTED', setConfiguration);


function init(gorillaFile){

    if(fs.existsSync(gorillaFile)){

    }

}

function setTemplate(name){

    template = name;

}

function modifyComposeFileBefore(gorillaFile, templatePath){

    var settings, folder, promisesPack;

    if(template === 'PHP-7'){

        settings = JSON.parse(fs.readFileSync(gorillaFile));

        promisesPack = [

            [tools.param, ['database', 'engine', ['No, thanks!', 'MySQL', 'PostgreSQL', 'MongoDB']], 'engine'],
            [configureEngine, [path.join(envPaths.plugins, 'db_php7'), templatePath, '{{engine}}']]

        ];
        promises.sandwich(promisesPack);

    }
    
}

function modifyComposeFileAfter(gorillaFile, templatePath){

    if(template === 'PHP-7'){

        appendEngine(gorillaFile, templatePath);

    }

}

function configureEngine(pluginPath, templatePath, engine){


    if(engine === 'PostgreSQL'){

        fsx.copySync(path.join(pluginPath, 'entrypoint-web.sh'), path.join(templatePath, 'entrypoint-web.sh'));

        fsx.copySync(path.join(pluginPath, 'entrypoint-postgresql.sh'), path.join(templatePath, 'entrypoint-postgresql.sh'));
        fsx.copySync(path.join(pluginPath, 'postgresql.conf'), path.join(templatePath, 'postgresql.conf'));
        fsx.copySync(path.join(pluginPath, 'index-postgresql.php'), path.join(templatePath, 'index.php'));
        fsx.copySync(path.join(pluginPath, 'docker-compose-postgresql.yml'), path.join(templatePath, 'docker-compose-postgresql.yml'));

    }else if(engine === 'MySQL'){

        fsx.copySync(path.join(pluginPath, 'entrypoint-web.sh'), path.join(templatePath, 'entrypoint-web.sh'));

        fsx.copySync(path.join(pluginPath, 'entrypoint-mariadb.sh'), path.join(templatePath, 'entrypoint-mariadb.sh'));
        fsx.copySync(path.join(pluginPath, 'index-mariadb.php'), path.join(templatePath, 'index.php'));
        fsx.copySync(path.join(pluginPath, 'docker-compose-mariadb.yml'), path.join(templatePath, 'docker-compose-mariadb.yml'));

    }else if(engine === 'MongoDB'){

        fsx.copySync(path.join(pluginPath, 'entrypoint-web.sh'), path.join(templatePath, 'entrypoint-web.sh'));

        fsx.copySync(path.join(pluginPath, 'entrypoint-mongo.sh'), path.join(templatePath, 'entrypoint-mongo.sh'));
        fsx.copySync(path.join(pluginPath, 'mongo-create-user.js'), path.join(templatePath, 'mongo-create-user.js'));
        fsx.copySync(path.join(pluginPath, 'index-mongo.php'), path.join(templatePath, 'index.php'));
        fsx.copySync(path.join(pluginPath, 'docker-compose-mongo.yml'), path.join(templatePath, 'docker-compose-mongo.yml'));

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

        engineFile = templatePath + '/docker-compose-mariadb.yml';

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

function setConfiguration(){

    var promisesPack, data;

    if(template == 'PHP-7' && (variables.stateOfProject === 'new' || variables.stateOfProject === 'force')){

        data = JSON.parse(fs.readFileSync(path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaFile)));

        promisesPack = [

            [commit.create, data.local.project.domain]

        ];

        promises.sandwich(promisesPack);

    }

}
