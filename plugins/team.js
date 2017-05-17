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
var targz = require('targz');
var execSync = require('child_process').execSync;

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var token = require(path.join(envPaths.libraries, 'login.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var promisesPack;

    if(argv._[0] === 'clone'){

        // Descargo el proyecto y lo instalo: creo el directorio del proyecto, las bases de datos y las imágenes, si hay.

    }else if(argv._[0] === 'push'){

        promisesPack = [

            [token.login],
            [getPolicy, [gorillaFile, '{{token}}']]

        ];
2
        promises.sandwich(promisesPack);

    }else if(argv._[0] === 'pull'){

    }

}

function getPolicy(gorillaFile, token){

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

            var serverData, exportPath, dataPath, projectPath, key, directory;

            if(!error){

                serverData = JSON.parse(body);

                if(serverData){

                    if(!serverData.hasOwnProperty('error')){

                        exportPath = path.join(variables.homeUserPath, variables.proxyName, 'export', data.local.project.id);

                        // Comprimo las bases de datos del proyecto.
                        dataPath = path.join(variables.homeUserPath, variables.proxyName, 'data', data.local.project.domain);
                        directory = fs.readdirSync(dataPath);

                        fsx.ensureDirSync(path.join(exportPath, 'data'));

                        for(key in directory){

                            targz.compress({

                                src: path.join(dataPath, directory[key]),
                                dest: path.join(exportPath, 'data', directory[key] + '.tar.gz')

                            }, function(error){

                                if(!error){

                                    // Comprimo los archivos del proyecto.
                                    targz.compress({

                                        src: variables.workingPath,
                                        dest: path.join(exportPath, 'project.tar.gz'),
                                        tar: {
                                            ignore: function(){

                                            }
                                        },
                                        gz: {
                                            level: 3,
                                            memLevel: 3
                                        }

                                    }, function(error){

                                        if(!error){

                                            if(data.local.hasOwnProperty('services')){

                                                // Recupero las imágenes que se han modificado del nodo "services" que tengo en el archivo gorillafile.
                                                fsx.ensureDirSync(path.join(exportPath, 'images'));

                                                for(key in data.local.services){

                                                    var output = execSync('docker save -o ' + path.join(exportPath, 'images', key) + ' ' + data.local.services[key]);

                                                    console.log(output.toString());

                                                }

                                            }

                                        }else{

                                        }

                                    });

                                }else{

                                    // Error de compresión.

                                }

                            });

                        }
                        

                    }else{

                        // Error. Muestro el mensaje del servidor.

                    }

                }else{

                    // Error desconocido.

                }





                // Stop the project to avoid problems with databases.
                // I can use stop, but later if I use start the project dont work.
                // docker-compose -f /Users/barreiros/Documents/workspace/Barreiros_GorillaJS_Landing/.gorilla/template/docker-compose.yml -p "gorillajslanding" stop
                
                // El usuario puede pasar un archivo para excluir archivos.

                // Create a task to package and compress all databases folders separately.
                
                // Create a task to package and compress the project folder.

                // packageProject(data);
                
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
