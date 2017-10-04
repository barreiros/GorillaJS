'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var through = require('through2');
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var AWS = require('aws-sdk');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var token = require(path.join(envPaths.libraries, 'login.js'));

// Para comprimir los plugins tar -zcvf [name].tar.gz [folder]
module.exports = {

    include: function(){

        var streamList, streamInclude, buffer, results, pluginsPath, promisesPack, pluginPath, sourcePath;

        pluginsPath = envPaths.plugins;

        if(argv._[0] === 'plugin'){
             
            if(argv._[1] === 'add' && argv._[2]){

                fsx.ensureDirSync(pluginsPath);

                promisesPack = [

                    // Intento descargar el plugin sin login.
                    [events.publish, ['STEP', ['downloading_plugin']]],
                    [downloadRequest, ['', argv._[2]]]

                ];

                promises.sandwich(promisesPack);
                        
            }else if(argv._[1] === 'remove'){

                if(fs.existsSync(path.join(pluginsPath, argv._[2]))){

                    fsx.removeSync(path.join(pluginsPath, argv._[2]));

                }else{
    
                    fsx.removeSync(path.join(pluginsPath, argv._[2] + '.js'));

                }

            }else if(argv._[1] === 'list'){

                fsx.ensureDirSync(pluginsPath);

                streamList = gulp.src(pluginsPath + '/**/*.js')

                    .pipe(through.obj(function (chunk, enc, cb) {

                        if(chunk._contents){

                            buffer = chunk._contents.toString();
                            results = buffer.match(/Plugin name/g);

                            if(results){

                                if(path.dirname(path.dirname(chunk.path)) === path.dirname(pluginsPath)){

                                    console.log(path.basename(chunk.path, '.js'));

                                }else{

                                    console.log(path.basename(path.dirname(chunk.path)));

                                }

                            }

                        }

                        cb();

                    }

                ));

                streamList.on('finish', function(){

                });

            }

        }

        if(fs.existsSync(pluginsPath)){

            streamInclude = gulp.src(pluginsPath + '/**/*.js')

                .pipe(through.obj(function (chunk, enc, cb) {

                    if(chunk._contents){

                        buffer = chunk._contents.toString();
                        results = buffer.match(/Plugin name/g);

                        if(results){

                            require(chunk.path);


                        }

                    }

                    cb();

                }

            ));

            streamInclude.on('finish', function(){

                events.publish('PROMISEME');

            });

        }else{

            events.publish('PROMISEME');

        }

    }

}

function installDependencies(pluginPath){

    var packagePath;

    // Si es un directorio...
    if(fs.lstatSync(pluginPath).isDirectory()){

        packagePath = path.join(pluginPath, 'package.json');

        // Si existe un archivo package.json, lo ejecuto para instalar las dependencias.
        if(fs.existsSync(packagePath)){

            cross.exec('npm install --prefix ' + pluginPath, function(err, stdout, stderr){

                events.publish('VERBOSE', [err, stderr, stdout]);

                events.publish('PROMISEME');

            });

        }

    }
    
}

function downloadRequest(userToken, plugin){

    var request, options, serverData;

    request = require('request');
    options = {

        url: variables.pluginsWebService + '/plugins/v1/download', 
        method: 'POST',
        headers: {

            'Content-type': 'application/json'

        }

    };

    if(userToken){

        options.body = JSON.stringify({

            plugin: plugin,
            token: userToken 

        });

    }else{

        options.body = JSON.stringify({

            plugin: plugin

        });

    }

    request.post(options, function(error, response, body){

        var promisesPack, command, s3;

        if(!error){

            serverData = JSON.parse(body);

            if(serverData.hasOwnProperty('error')){

                switch(serverData.error){

                    case 1:

                        events.publish('ERROR', ['The plugin does not exists']);
                        
                        break;

                    case 2:

                        promisesPack = [

                            // Identifico al usuario.
                            [token.login, [], 'token'],
                            [events.publish, ['STEP', ['login_ok']]],
                            // Vuelvo a intentar descargar el plugin enviándole el token.
                            [downloadRequest, ['{{token}}', argv._[2]]],
                            // Instalo las dependencias.
                            [events.publish, ['STEP', ['installing_plugin_dependencies']]],
                            [installDependencies, [path.join(envPaths.plugins, plugin)]],
                            [events.publish, ['STEP', ['plugin_installed']]]

                        ];

                        promises.sandwich(promisesPack);
                        promises.start();

                        break;

                    case 3:

                        events.publish('ERROR', ['You need a valid license for this plugin. Please, visit gorillajs.com']);

                        break;

                    default:

                        // Error desconocido.
                        events.publish('ERROR', ['Unable to download the plugin.']);

                }

            }else if(serverData.hasOwnProperty('credentials')){

                s3 = new AWS.S3();

                process.env.AWS_ACCESS_KEY_ID = serverData.credentials.AccessKeyId;
                process.env.AWS_SECRET_ACCESS_KEY = serverData.credentials.SecretAccessKey;
                process.env.AWS_SESSION_TOKEN = serverData.credentials.SessionToken;
                process.env.AWS_DEFAULT_REGION = 'eu-west-1';

                s3.getObject({

                    Bucket: serverData.bucket,
                    Key: serverData.key

                }, function(err, data){

                    if(err){

                        events.publish('VERBOSE', [err]);
                        events.publish('ERROR', ['Unable to download the plugin.']);

                    }else{

                        fs.writeFileSync(path.join(envPaths.plugins, serverData.key), data.Body);

                        cross.exec('docker run -v ' + envPaths.plugins + ':/root/plugins gorillajs/tools /bin/sh -c "tar zxvf /root/plugins/' + serverData.key + ' -C /root/plugins/"', function(err, stdout, stderr){

                            events.publish('VERBOSE', [stderr + err + stdout]);
                            if (err) events.publish('ERROR', ['Unable to extract the plugin.']);

                            fsx.removeSync(path.join(envPaths.plugins, serverData.key));

                            events.publish('PROMISEME');

                        });

                    }

                });

            }else{

                // Error desconocido.
                events.publish('ERROR', ['Unable to download the plugin.']);

            }

        }else{

            events.publish('ERROR', ['Unable to connect with the server. Please, try again later.']);

        }

    });

}
