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

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var token = require(path.join(envPaths.libraries, 'login.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var promisesPack;

    if(argv._[0] === 'clone'){

        // Descargo el proyecto y lo instalo: creo el directorio del proyecto, las bases de datos y las imágenes, si hay.

    }else if(argv._[0] === 'push'){

        promisesPack = [

            [token.login],
            [runBackup, [gorillaFile, '{{token}}']]

        ];

        promises.sandwich(promisesPack);

    }else if(argv._[0] === 'pull'){

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

            var serverData, exportPath, key, command, excludes, composePath;

            if(!error){

                serverData = JSON.parse(body);

                console.log(serverData.query);

                if(serverData){

                    if(!serverData.hasOwnProperty('error')){

                        // Pauso los contenedores del proyecto para no tener problemas con las bases de datos.
                        composePath = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaTemplateFolder, 'docker-compose.yml');

                        cross.exec('docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' pause', function(err, stdout, stderr){

                            events.publish('VERBOSE', [err, stderr, stdout]);

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
                                    variables.workingPath + ':/etc/export/project',
                                    '-v',
                                    path.join(variables.homeUserPath, variables.proxyName, 'data', data.local.project.id) + ':/etc/export/data',
                                    'gorillajs/tools',
                                    '/bin/sh',
                                    '-c',
                                    'duplicity ' + excludes + ' --progress --s3-use-new-style --s3-european-buckets --s3-unencrypted-connection --allow-source-mismatch --no-encryption /etc/export s3+http://' + path.join(serverData.bucket, serverData.path)
                            ]);

                            command.stdout.on('data', function (data) {
                                console.log(data.toString());
                            });

                            command.stderr.on('data', function (data) {
                                console.log(data.toString());
                            });

                            command.on('exit', function (code) {

                                cross.exec('docker-compose -f ' + composePath + ' -p ' + data.local.project.domain + ' unpause', function(err, stdout, stderr){

                                    events.publish('VERBOSE', [err, stderr, stdout]);

                                });

                            });


                        });


                        // // Comprimo las imágenes del proyecto
                        // if(!argv.hasOwnProperty('exclude-images')){ // Si el usuario no ha excluido esta opción.
                        //
                        //     if(data.local.hasOwnProperty('services')){
                        //
                        //         exportPath = path.join(variables.homeUserPath, variables.proxyName, 'export', data.local.project.id);
                        //
                        //         // Recupero las imágenes que se han modificado del nodo "services" que tengo en el archivo gorillafile.
                        //         fsx.ensureDirSync(path.join(exportPath, 'images'));
                        //
                        //         for(key in data.local.services){
                        //
                        //             command = 'docker save -o ' + path.join(exportPath, 'images', key) + '.tar ' + data.local.services[key];
                        //             // output = execSync(command);
                        //
                        //         }
                        //
                        //     }
                        //
                        // }

                    }else{

                        // Error. Muestro el mensaje del servidor.

                    }

                }else{

                    // Error desconocido.

                }
                
            }else{

                // Error de servidor.

            }

        });

    }else{

        events.publish('ERROR', ['030']);

    }

}

function packageProject(data){


}
