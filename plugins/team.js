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
var execSync = require('child_process').execSync;
var AWS = require('aws-sdk');
var glob = require('glob');

var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
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

            // Aquí siempre tengo un error que no inicia esta parte solo la primera vez que ejecuto el comando push. No estoy seguro de si solo pasa si no está creada la carpeta de exportación.

            var serverData, exportPath, dataPath, projectPath, key, directory, command, output, readStream, s3;

            if(!error){

                serverData = JSON.parse(body);

                console.log(serverData.query);

                if(serverData){

                    if(!serverData.hasOwnProperty('error')){

                        exportPath = path.join(variables.homeUserPath, variables.proxyName, 'export', data.local.project.id);

                        // Stop the project to avoid problems with databases.???


                        // Comprimo las bases de datos del proyecto.
                        if(!argv.hasOwnProperty('exclude-data')){ // Si el usuario no ha excluido esta opción.

                            dataPath = path.join(variables.homeUserPath, variables.proxyName, 'data', data.local.project.id);
                            directory = fs.readdirSync(dataPath);

                            fsx.ensureDirSync(path.join(exportPath, 'data'));

                            for(key in directory){

                                if(fs.lstatSync(path.join(dataPath, directory[key])).isDirectory()){

                                    // Tengo que añadir de alguna manera un archivo con los directorios que quiero excluir.

                                    command = 'docker run -v ' + path.join(exportPath, 'data') + ':/etc/export -v ' + path.join(dataPath, directory[key]) + ':/etc/data busybox /bin/sh -c "cd /etc/data && tar -cf /etc/export/' + directory[key] + '.tar ."';
                                    // execSync(command);

                                }

                            }

                        }


                        // Comprimo los archivos del proyecto.
                        if(!argv.hasOwnProperty('exclude-files')){ // Si el usuario no ha excluido esta opción.

                            // Recupero el archivo .teamignore y genero un string con los archivos que quiero necesito excluir para pasárselo al comando sync de aws cli.
                            fsx.ensureFileSync(path.join(variables.workingPath, '.teamignore'));

                            // Leo las líneas.
                            var excludes = fs.readFileSync(path.join(variables.workingPath, '.teamignore')).toString().split('\n').filter(function(line){;

                                if(line !== ''){

                                    return true;

                                }

                            }).map(function(line){
                                
                                return '--exclude \'/etc/export/project/' + line + '\'';

                            });

                            excludes = excludes.join(' ');

                            command = 'docker run -e AWS_DEFAULT_REGION="eu-west-1" -e AWS_ACCESS_KEY_ID="' + serverData.credentials.AccessKeyId + '" -e AWS_SECRET_ACCESS_KEY="' + serverData.credentials.SecretAccessKey + '" -e AWS_SECURITY_TOKEN="' + serverData.credentials.SessionToken + '" -v ' + variables.workingPath + ':/etc/export/project gorillajs/tools /bin/sh -c "duplicity ' + excludes + ' --progress --s3-use-new-style --s3-european-buckets --s3-unencrypted-connection --allow-source-mismatch --no-encryption /etc/export/project s3+http://' + path.join(serverData.bucket, serverData.path, 'project') + '"';
                            
                            // console.log(command);

                            // execSync(command);

                            console.log(command);

                            cross.exec(command, function(err, stdout, stderr){

                                console.log(err, stdout, stderr);

                                events.publish('VERBOSE', [err, stderr, stdout]);

                            });

                        }else{

                            command = 'docker run -v ' + exportPath + ':/etc/export -v ' + variables.workingPath + ':/etc/data busybox /bin/sh -c "cd /etc/data && tar -cf /etc/export/project.tar .gorilla"';
                            // execSync(command);

                        }


                        // Comprimo las imágenes del proyecto
                        if(!argv.hasOwnProperty('exclude-images')){ // Si el usuario no ha excluido esta opción.

                            if(data.local.hasOwnProperty('services')){

                                // Recupero las imágenes que se han modificado del nodo "services" que tengo en el archivo gorillafile.
                                fsx.ensureDirSync(path.join(exportPath, 'images'));

                                for(key in data.local.services){

                                    command = 'docker save -o ' + path.join(exportPath, 'images', key) + '.tar ' + data.local.services[key];
                                    // output = execSync(command);

                                }

                            }

                        }


                        // Creo las variables globales para identificarme en AWS.
                        // process.env['AWS_ACCESS_KEY_ID'] = serverData.credentials.AccessKeyId;
                        // process.env['AWS_SECRET_ACCESS_KEY'] = serverData.credentials.SecretAccessKey;
                        // process.env['AWS_SESSION_TOKEN'] = serverData.credentials.SessionToken;
                

                        // Subo el contenido de la carpeta export al bucket.
                        // glob(path.join(exportPath, '**', '*.{tar,tar.gz}'), function(err, files){
                        // glob(path.join(variables.workingPath, '**', '*'), function(err, files){
                        //
                        //     console.log(files);
                        //
                        //     s3 = new AWS.S3({
                        //         params: {
                        //             apiVersion: '2006-03-01',
                        //             Bucket: serverData.bucket
                        //         }
                        //     });
                        //
                        //     console.log(serverData);
                        //
                        //     for(key in files){
                        //
                        //         if(fs.lstatSync(files[key]).isFile()){
                        //
                        //             console.log(path.join(serverData.path, files[key].replace(exportPath + '/', '')));
                        //
                        //             s3.upload({
                        //                 Key: path.join(serverData.path, files[key].replace(exportPath + '/', '')),
                        //                 Body: fs.readFileSync(files[key])
                        //             }).on('httpUploadProgress', function(e){
                        //
                        //                 console.log('Uploaded :: ' + parseInt((evt.loaded * 100) / evt.total) + '%');
                        //
                        //             }).send(function(err, data){
                        //
                        //                 // console.log(err, data);
                        //                 console.log('File ' + files[key] + ' uploaded');
                        //
                        //             });
                        //
                        //         }
                        //
                        //     }
                        //
                        // });

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
