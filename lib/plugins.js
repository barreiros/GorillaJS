'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var through = require('through2');
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));

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

module.exports = {

    include: function(){

        var streamList, streamInclude, buffer, results, pluginsPath, promisesPack, pluginPath, sourcePath;

        pluginsPath = envPaths.plugins;
        fsx.ensureDirSync(pluginsPath);

        if(argv._[0] === 'plugin'){
             
            if(argv._[1] === 'add' && argv._[2]){

                sourcePath = path.resolve(argv._[2]);
                pluginPath = path.join(pluginsPath, path.basename(argv._[2]));
                
                promisesPack = [

                    // Muevo los archivos al directorio.
                    [cross.moveFiles, [pluginPath, false, '', argv._[2]]],
                    // Instala las dependencias.
                    [installDependencies, pluginPath],
                    [events.publish, ['STEP', ['Plugin installed!']]],

                ];

                promises.sandwich(promisesPack);
                        
            }else if(argv._[1] === 'remove'){


                if(fs.existsSync(path.join(pluginsPath, argv._[2]))){

                    fsx.removeSync(path.join(pluginsPath, argv._[2]));

                }else{
    
                    fsx.removeSync(path.join(pluginsPath, argv._[2] + '.js'));

                }

            }else if(argv._[1] === 'list'){

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

    }

}
