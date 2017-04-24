/**
 * Plugin name: Adminer
 * 
 */

'use strict';

var path = require('path');
var fs = require('fs');
var fsx = require('fs-extra');
var yaml = require('yamljs');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

events.subscribe('INIT_PLUGINS', init);
events.subscribe('DOCKER_STARTED', addAdminer);

var gorillaData;

function init(gorillaFile){

    gorillaData = JSON.parse(fs.readFileSync(gorillaFile));

}

function loadList(listPath){

    var list;


    fsx.ensureFileSync(listPath);

    list = fs.readFileSync(listPath).toString();

    if(list === ''){

        return {};

    }else{

        return JSON.parse(list);

    }

}

function addAdminer(){

    var list, listPath, composePath, dataPath, domain, output;

    composePath = path.join(variables.workingPath, variables.gorillaFolder, variables.gorillaTemplateFolder, variables.composeFile);
    dataPath = path.join(variables.homeUserPath, variables.proxyName, 'data');
    domain = gorillaData.local.project.domain;
    listPath = path.join(variables.homeUserPath, variables.proxyName, 'adminer', 'list.json');


    // Recupero la ruta del archivo docker-compose.
    yaml.load(composePath, function(compose){

        if(compose.hasOwnProperty('services')){

            // Cargo el archivo con la lista de containers con base de datos de los dominios.
            list = loadList(listPath);
            list[domain] = [];

            // Parseo el archivo docker-compose y busco en cada servicio y si tiene un volumen apuntando a la carpeta data_path, incluyo el contenedor a la lista.
            for(var service in compose.services){

                if(compose.services[service].hasOwnProperty('volumes')){

                    for(var volume in compose.services[service].volumes){

                        if(compose.services[service].volumes[volume].indexOf(dataPath) > -1){

                            list[domain].push(service);

                            break;

                        }

                    }

                }

            }

        }

        // Guardo el archivo de la lista en la carpeta global y en el directorio público que le voy a pasar al proxy.
        if(list.hasOwnProperty(domain)){

            output = JSON.stringify(list, null, '\t');
            fs.writeFileSync(listPath, output);
            fs.writeFileSync(envPaths.plugins + '/adminer/public/list.json', output);

        }

        // Copio los contenidos en el contenedor: script bash y carpeta pública.
        cross.exec('docker cp ' + envPaths.plugins + '/adminer/public/. gorillajsproxy:/var/www/adminer && docker cp ' + envPaths.plugins + '/adminer/server/. gorillajsproxy:/etc/adminer', function(err, stdout, stderr){

            console.log(err, stdout, stderr);
            // Ejecuto el script de bash.

        });

    });

}

