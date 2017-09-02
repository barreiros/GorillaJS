'use strict';

var path = require('path');
var yaml = require('yamljs');
var fs = require('fs');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

events.subscribe('COMMIT_CHANGES', create);

module.exports = {

    create: create,
    replace: replaceImage

};

function create(containerName){

    var gorillaFile, composeFile, data, key, serviceName, imageName;
    
    gorillaFile = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaFile);
    composeFile = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaTemplateFolder, variables.composeFile);

    if(containerName === 'gorillajsproxy'){ // Hago una excepción para el contenedor del proxy porque es común.

        // Revisar el error "max depth exceeded".
        cross.exec('docker commit -p=false gorillajsproxy gorillajs/proxy', function(err, stdout, stderr){

            events.publish('VERBOSE', [err, stderr, stdout]);
            if (err) events.publish('ERROR', ['043']);

            events.publish('PROMISEME');

        });

    }else{

        // Recupero el nombre del servicio en el archivo docker-compose. 
        yaml.load(composeFile, function(file){

            for(key in file.services){

                if(file.services[key].container_name === containerName){

                    serviceName = key;

                }

            }

            if(serviceName){

                // Recupero el listado con los nombres de las imágenes creadas en el archivo gorillafile.
                data = JSON.parse(fs.readFileSync(gorillaFile));

                if(data.local.hasOwnProperty('services')){

                    for(var key in data.local.services){

                        if(data.local.services[key] === serviceName){

                            imageName = data.local.services[key];

                        }

                    }

                }else{

                    data.local.services = {};

                }

                // Si no existía una imagen creada para este servicio, genero el nombre (project.ID* + service.name).
                if(!imageName){

                    imageName = data.local.project.id + '/' + serviceName;

                    // Actualizo el gorillafile con el nombre 
                    data.local.services[serviceName] = imageName;
                    fs.writeFileSync(gorillaFile, JSON.stringify(data, null, '\t'));

                }

                // Creo el commit pasándole el containerName y el imageName.
                cross.exec('docker commit -p=false ' + containerName + ' ' + imageName, function(err, stdout, stderr){

                    events.publish('VERBOSE', [err, stderr, stdout]);
                    if (err) events.publish('ERROR', ['043']);

                    events.publish('PROMISEME');

                });

            }else{

                // Error: No existe el contenedor.
                events.publish('ERROR', ['042']);

            }

        });

        
    
    }

}

function replaceImage(){

    var gorillaFile, composeFile, data, key, hasChange;
    
    gorillaFile = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaFile);
    composeFile = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaTemplateFolder, variables.composeFile);
    data = JSON.parse(fs.readFileSync(gorillaFile));

    // Añado un nombre de contenedor a los que no lo tengan.
    yaml.load(composeFile, function(file){

        for(key in file.services){

            if(!file.services[key].hasOwnProperty('container_name')){

                file.services[key].container_name = data.local.project.domain + '_' + key;
                hasChange = true;

            }

        }

        // Recupero el listado con los nombres de las imágenes creadas en el archivo gorillafile.
        if(data.local.hasOwnProperty('services')){

            // Si se ha creado alguna imagen, actualizo el nombre de las imágenes de cada servicio en el archivo docker-compose, que ya está en la carpeta del proyecto.
            for(key in data.local.services){

                if(file.services.hasOwnProperty(key)){

                    file.services[key].image = data.local.services[key];
                    hasChange = true;

                }

            }

        }

        if(hasChange){

            fs.writeFileSync(composeFile, yaml.stringify(file, 6)); 

        }

        events.publish('PROMISEME');

    });
    
}

