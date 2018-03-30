import { PROJECT_ENV } from '../../const.js'
import { events } from '../../class/Events.js'

class Django{

    constructor(){

        events.subscribe('CONFIG_FILE_CREATED', (config) => {
            
            console.log('Este es el plugin Django')
                
        })

    }

}

export default new Django() 

// 'use strict';
//
// var argv = require('minimist')(process.argv.slice(2));
// var fs = require('fs');
// var fsx = require('fs-extra');
// var path = require('path');
// var yaml = require('yamljs');
//
// var variables = require(path.join(envPaths.libraries, 'variables.js'));
// var events = require(path.join(envPaths.libraries, 'pubsub.js'));
// var tools = require(path.join(envPaths.libraries, 'tools.js'));
// var promises = require(path.join(envPaths.libraries, 'promises.js'));
// var commit = require(path.join(envPaths.libraries, 'commit.js'));
//
// var template = '';
//
// events.subscribe('TEMPLATE_SELECTED', setTemplate);
// events.subscribe('BEFORE_SET_TEMPLATE_VARIABLES', modifyComposeFileBefore);
// events.subscribe('AFTER_SET_TEMPLATE_VARIABLES', modifyComposeFileAfter);
// events.subscribe('DOCKER_STARTED', setConfiguration);
//
// function setTemplate(name){
//
//     template = name;
//
// }
//
// function modifyComposeFileBefore(gorillaFile, templatePath){
//
//     var settings, folder, promisesPack;
//
//     if(template == 'Django'){
//
//         settings = JSON.parse(fs.readFileSync(gorillaFile));
//
//         promisesPack = [
//
//             [tools.param, ['database', 'engine', ['SQLite', 'PostgreSQL', 'MySQL']], 'engine'],
//             [events.publish, ['STEP', ['django_database_config']]],
//             [configureEngine, [path.join(envPaths.plugins, 'db_django'), templatePath, '{{engine}}']]
//
//         ];
//         promises.sandwich(promisesPack);
//
//     }
//
// }
//
//
// function configureEngine(pluginPath, templatePath, engine){
//
//     if(engine === 'PostgreSQL'){
//
//         fsx.copySync(path.join(pluginPath, 'entrypoint-web.sh'), path.join(templatePath, 'entrypoint-web.sh'));
//
//         fsx.copySync(path.join(pluginPath, 'entrypoint-postgresql.sh'), path.join(templatePath, 'entrypoint-postgresql.sh'));
//         fsx.copySync(path.join(pluginPath, 'postgresql.conf'), path.join(templatePath, 'postgresql.conf'));
//         fsx.copySync(path.join(pluginPath, 'docker-compose-postgresql.yml'), path.join(templatePath, 'docker-compose-postgresql.yml'));
//         fsx.copySync(path.join(pluginPath, 'settings-postgresql'), path.join(templatePath, 'settings-postgresql'));
//
//     }else if(engine === 'MySQL'){
//
//         fsx.copySync(path.join(pluginPath, 'entrypoint-web.sh'), path.join(templatePath, 'entrypoint-web.sh'));
//
//         fsx.copySync(path.join(pluginPath, 'entrypoint-mariadb.sh'), path.join(templatePath, 'entrypoint-mariadb.sh'));
//         fsx.copySync(path.join(pluginPath, 'docker-compose-mariadb.yml'), path.join(templatePath, 'docker-compose-mariadb.yml'));
//         fsx.copySync(path.join(pluginPath, 'settings-mariadb'), path.join(templatePath, 'settings-mariadb'));
//
//     }
//
//     events.publish('PROMISEME');
//
// }
//
// function modifyComposeFileAfter(gorillaFile, templatePath){
//
//     var settings, promisesPack;
//
//     if(template == 'Django'){
//
//         settings = JSON.parse(fs.readFileSync(gorillaFile));
//
//         promisesPack = [
//
//             [checkDatabaseEngine, [gorillaFile, templatePath]]
//
//         ];
//         promises.sandwich(promisesPack);
//
//     }
//
// }
//
// function checkDatabaseEngine(gorillaFile, templatePath){
//
//     var settings, links, composeFile, engineFile;
//
//     settings = JSON.parse(fs.readFileSync(gorillaFile));
//     composeFile = templatePath + '/docker-compose.yml';
//
//     yaml.load(composeFile, function(fileWeb){
//
//         if(!fileWeb.services['web'].hasOwnProperty('depends_on')){
//
//             fileWeb.services['web'].depends_on = [];
//
//         }
//
//         if(settings.local.database.engine === 'PostgreSQL'){
//
//             engineFile = templatePath + '/docker-compose-postgresql.yml';
//             yaml.load(engineFile, function(fileEngine){
//
//                 fileWeb.services['postgresql'] = fileEngine.services.postgresql;
//                 fileWeb.services['web'].depends_on.push('postgresql');
//                 fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 
//
//                 events.publish('PROMISEME');
//
//             });
//
//         }else if(settings.local.database.engine === 'MySQL'){
//
//             engineFile = templatePath + '/docker-compose-mariadb.yml';
//             yaml.load(engineFile, function(fileEngine){
//
//                 fileWeb.services['mysql'] = fileEngine.services.mysql;
//                 fileWeb.services['web'].depends_on.push('mysql');
//                 fs.writeFileSync(composeFile, yaml.stringify(fileWeb, 6)); 
//
//                 events.publish('PROMISEME');
//
//             });
//
//         }else{
//
//             events.publish('PROMISEME');
//
//         }
//
//     });
//
// }
//
// function setConfiguration(){
//
//     var gorillaFile, settings;
//
//     if(template == 'Django'){
//
//         settings = JSON.parse(fs.readFileSync(path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaFile)));
//
//         promises.sandwich([commit.create, settings.local.project.domain]);
//
//     }
//
//     events.publish('PROMISEME');
// }
//
