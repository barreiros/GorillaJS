/**
 * Plugin name: Team
 * 
 */


'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');
var AWS = require('aws-sdk');
var glob = require('glob');
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;
var mkdirp = require('mkdirp');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var token = require(path.join(envPaths.libraries, 'login.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var promisesPack, uuid;

    if(argv._[0] === 'push'){

        promisesPack = [

            [token.login],
            [runBackup, [gorillaFile, '{{token}}']]

        ];

        promises.sandwich(promisesPack);

    }else if(argv._[0] === 'pull'){

        promisesPack = [
            [token.login],
            [extractBackup, [gorillaFile, '{{token}}', argv._[1]]]
        ];

        promises.sandwich(promisesPack);
        
    }

}

function extractBackup(gorillaFile, token, uuid){

    var workingPath, data, id, request, options, serverData; 

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        // Compruebo si ya existe un proyecto.     
        if(data.hasOwnProperty('local')){

            id = data.local.project.id;

        }

    }


    // Compruebo si el uuid es válido.
    if(!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid)){

        uuid = null;

    }

    // El usuario puede necesitar descargar un proyecto desde cero o actualizar uno que ya exista. En ambos casos puede pasar una path.
    // Compruebo si el usuario ha especificado una carpeta de destino, para corregir el path. Si existe el uuid compruebo si lleva tercer parámetro, y si no, segundo.
    if(uuid && argv._[2]){

        mkdirp.sync(argv._[2]);
        workingPath = path.resolve(argv._[2]);

    }else if(argv._[1] && !uuid){

        mkdirp.sync(argv._[1]);
        workingPath = path.resolve(argv._[1]);

    }else{

        workingPath = variables.projectPath;

    }
    

    // Si existe el uuid y el proyecto, solo en el caso de ser iguales, inicio el backup. Si no, devuelvo un error al usuario advirtiéndole de que no puede descargar un proyecto sobre otro.

    if(!id && !uuid){ // Si no existe un identificador de proyecto válido.

        events.publish('ERROR', ['You need a valid project id.']);
        
    }else if(id && uuid && id !== uuid){ // Si el proyecto existe, pero es distinto del que quiere descargar el usuario. 

        events.publish('ERROR', ['Folder already contains a project.']);

    }else{ // Si no hay error, descargo el proyecto.

        if(!uuid && id){

            uuid = id;

        }

        // Compruebo si el usuario tiene permisos de lectura sobre el proyecto. Tengo que cambiar el backend para que me devuelva los privilegios del usuario.
        request = require('request');
        options = {
            
            url: 'http://gorillajs.landing/wp-json/amazon/v1/login',
            method: 'POST',
            headers: {

                'Content-type': 'application/json'

            },
            body: JSON.stringify({

                token: token,
                project_id: uuid

            })

        };

        request.post(options, function(error, response, body){

            var exportPath, composePath, command, status, servicesPaused;

            if(!error){

                serverData = JSON.parse(body);
                exportPath = path.join(variables.homeUserPath, variables.proxyName, 'export', uuid);

                if(id){// Si hay algún proyecto iniciado lo detengo para no tener problemas con la base de datos.

                    composePath = path.join(workingPath, variables.gorillaFolder, variables.gorillaTemplateFolder, 'docker-compose.yml');
                    command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' ps -q';
                    status = execSync(command);

                    if(status.toString() !== ''){

                        command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' pause';
                        execSync(command);
                        servicesPaused = true;

                    }

                }


                // Ejecuto el comando en el contenedor "gorillajs/tools", que es donde tengo instalado Duplicity.
                // Descargo los archivos del repositorio. Tengo que montar la imagen con tres volúmenes, como cuando genero el backup. 
                command = spawn('docker', [
                        'run',
                        '-e',
                        'AWS_DEFAULT_REGION=eu-west-1',
                        '-e',
                        'AWS_ACCESS_KEY_ID=' + serverData.credentials.AccessKeyId,
                        '-e',
                        'AWS_SECRET_ACCESS_KEY=' + serverData.credentials.SecretAccessKey,
                        '-e',
                        'AWS_SECURITY_TOKEN=' + serverData.credentials.SessionToken,
                        '-v',
                        path.join(exportPath, 'images') + ':/etc/export/images',
                        '-v',
                        workingPath + ':/etc/export/project',
                        '-v',
                        path.join(variables.homeUserPath, variables.proxyName, 'data', uuid) + ':/etc/export/data',
                        '-v',
                        path.join(exportPath, 'cache') + ':/etc/export/cache',
                        'gorillajs/tools',
                        '/bin/sh',
                        '-c',
                        'duplicity restore --archive-dir=/etc/export/cache --name=gorillajs --force --progress --s3-use-new-style --s3-european-buckets --s3-unencrypted-connection --allow-source-mismatch --no-encryption s3+http://' + path.join(serverData.bucket, serverData.path) + ' /etc/export'
                ]);

                command.stdout.on('data', function (data) {
                    console.log(data.toString());
                });

                command.stderr.on('data', function (data) {
                    console.log(data.toString());
                });

                command.on('exit', function (code) {

                    var key;

                    // Si he parado el proyecto, lo vuelvo a arrancar.
                    if(servicesPaused){

                        command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' unpause';
                        execSync(command);

                    }

                    // Uso el archivo gorillaFile que se acaba de descargar.
                    data = JSON.parse(fs.readFileSync(path.join(workingPath, variables.gorillaFolder, variables.gorillaFile)));

                    // Monto las imágenes que se han modificado del nodo "services" que tengo en el archivo gorillafile.
                    for(key in data.local.services){

                        command = 'docker load -i ' + path.join(exportPath, 'images', key) + '.tar ';
                        execSync(command);

                    }

                    // Si el proyecto es nuevo, o lleva el parámetro -f, le digo al usuario que lo compile para terminar la instalación.
                    if(!id){

                        events.publish('STEP', ['Your files are ready. Please, run "gorilla build" or "gorilla build -f" to finish the installation.']);

                    }

                });

            }else{

                events.publish('ERROR', ['Unable to connect with the server. Please, try again later.']);

            }

        });
        

    }

}

function runBackup(gorillaFile, token){

    var argTail, data, request, options;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        request = require('request');
        options = {
            
            url: 'http://gorillajs.landing/wp-json/amazon/v1/login',
            method: 'POST',
            headers: {

                'Content-type': 'application/json'

            },
            body: JSON.stringify({

                token: token,
                project_id: data.local.project.id

            })

        };

        request.post(options, function(error, response, body){

            // Aquí siempre tengo un error que no inicia esta parte solo la primera vez que ejecuto el comando push. No estoy seguro de si solo pasa si no está creada la carpeta de exportación.

            var serverData, exportPath, key, command, excludes, composePath, status, servicesPaused;

            if(!error){

                serverData = JSON.parse(body);

                if(serverData){

                    if(!serverData.hasOwnProperty('error')){

                        // Pauso los contenedores del proyecto para no tener problemas con las bases de datos.
                        composePath = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaTemplateFolder, 'docker-compose.yml');

                        command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' ps -q';
                        status = execSync(command);

                        if(status.toString() !== ''){

                            command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' pause';
                            execSync(command);
                            servicesPaused = true;

                        }

                        // Comprimo las imágenes del proyecto
                        exportPath = path.join(variables.homeUserPath, variables.proxyName, 'export', data.local.project.id);

                        if(data.local.hasOwnProperty('services')){

                            // Recupero las imágenes que se han modificado del nodo "services" que tengo en el archivo gorillafile.
                            fsx.ensureDirSync(path.join(exportPath, 'images'));

                            for(key in data.local.services){

                                command = 'docker save -o ' + path.join(exportPath, 'images', key) + '.tar ' + data.local.services[key];
                                execSync(command);

                            }

                        }

                        // Recupero el archivo .teamignore y genero un string con los archivos que quiero necesito excluir para pasárselo al comando sync de aws cli.
                        fsx.ensureFileSync(path.join(variables.workingPath, '.teamignore'));

                        // Convierto el archivo en un listado que pueda usar en el comando.
                        excludes = fs.readFileSync(path.join(variables.workingPath, '.teamignore')).toString().split('\n').filter(function(line){;

                            if(line !== ''){

                                return true;

                            }

                        }).map(function(line){
                            
                            return '--exclude \'/etc/export/project/' + line + '\'';

                        });
                        excludes = excludes.join(' ');

                        
                        // Ejecuto el comando en el contenedor "gorillajs/tools", que es donde tengo instalado Duplicity.
                        command = spawn('docker', [
                            'run',
                            '-e',
                            'AWS_DEFAULT_REGION=eu-west-1',
                            '-e',
                            'AWS_ACCESS_KEY_ID=' + serverData.credentials.AccessKeyId,
                            '-e',
                            'AWS_SECRET_ACCESS_KEY=' + serverData.credentials.SecretAccessKey,
                            '-e',
                            'AWS_SECURITY_TOKEN=' + serverData.credentials.SessionToken,
                            '-v',
                            path.join(exportPath, 'images') + ':/etc/export/images',
                            '-v',
                            variables.workingPath + ':/etc/export/project',
                            '-v',
                            path.join(variables.homeUserPath, variables.proxyName, 'data', data.local.project.id) + ':/etc/export/data',
                            '-v',
                            path.join(exportPath, 'cache') + ':/etc/export/cache',
                            'gorillajs/tools',
                            '/bin/sh',
                            '-c',
                            'duplicity --archive-dir=/etc/export/cache --name=gorillajs ' + excludes + ' --progress --s3-use-new-style --s3-european-buckets --s3-unencrypted-connection --allow-source-mismatch --no-encryption /etc/export s3+http://' + path.join(serverData.bucket, serverData.path)
                        ]);

                        command.stdout.on('data', function (data) {
                            console.log(data.toString());
                        });

                        command.stderr.on('data', function (data) {
                            events.publish('ERROR', ['Problem with the backup engine. Please, try again.']);
                        });

                        command.on('exit', function (code) {

                            // Si he parado el proyecto, lo vuelvo a arrancar.
                            if(servicesPaused){

                                command = 'docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' unpause';
                                execSync(command);

                            }

                        });

                    }else{

                        events.publish('ERROR', ['Unable to connect with the server. Please, try again later.']);

                    }

                }else{

                    events.publish('ERROR', ['Unknow error. Please, try again later.']);

                }
                
            }else{

                events.publish('ERROR', ['Unable to connect with the server. Please, try again later.']);

            }

        });

    }else{

        events.publish('ERROR', ['Missing project. Please, use a valid project folder.']);

    }

}
