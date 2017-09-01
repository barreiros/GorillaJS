var path = require('path');
var escapeRegExp = require('escape-string-regexp');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var exec = require('child_process').exec;

var projectPath;
var count = 0;

module.exports = {

    config: function(path){
        projectPath = path;

        events.publish('PROMISEME');
    },

    exec: function(command, callback, remote, params){

        var internalCount;

        count += 1;
        internalCount = count;

        if(!params) params = {};

        events.publish('VERBOSE', ['Inicio el comando: ' + internalCount + ' - ' + command]);

        exec(command, params, function(err, stdout, stderr){

            callback(err, stdout, stderr);

        }).on('close', function(){

            events.publish('VERBOSE', ['Termino el comando: ' + internalCount + ' - ' + command]);

        });

    },

    removeFiles: function(to, remote, exclude, source){

        var count, toPath, files;

        if(typeof source === 'object'){
            count = 0;
            if(source.length > 0){
                source.forEach(function(file, index){
                    toPath = path.join(to, file);
                    if(fs.existsSync(toPath)){
                        if(!fs.lstatSync(toPath).isDirectory()){
                            events.publish('VERBOSE', ['Removing file ' + toPath]);
                            fs.unlink(toPath);
                            module.exports.exec('ls ' + path.dirname(toPath), function(err, stdout, stderr){
                                if (err) events.publish('WARNING', ['012']);
                                events.publish('VERBOSE', [err]);
                                events.publish('VERBOSE', [stdout]);

                                // if(stdout === ''){
                                if(stdout === '' && path.dirname(toPath) !== projectPath){
                                    module.exports.exec('rm -rf ' + path.dirname(toPath), function(err, stdout, stderr){
                                        count += 1;
                                        if(count === source.length){
                                            events.publish('PROMISEME');
                                        }
                                    });
                                }else{
                                    count += 1;
                                    if(count === source.length){
                                        events.publish('PROMISEME');
                                    }
                                }
                            });
                        }else{
                            
                            module.exports.exec('rm -rf ' + file, function(err, stdout, stderr){
                                count += 1;
                                if(count === source.length){
                                    events.publish('PROMISEME');
                                }
                            });
                        }
                    }else{
                        events.publish('PROMISEME');
                    }
                });
            }else{
                events.publish('PROMISEME');
            }
        }else{
            
            if(fs.existsSync(source)){
                fs.unlink(source);
            }
            module.exports.exec('ls ' + path.dirname(source), function(err, stdout, stderr){
                if(stdout !== '' && path.dirname(source) !== projectPath){
                    module.exports.exec('rm -rf ' + path.dirname(source), function(err, stdout, stderr){
                        events.publish('PROMISEME');
                    });
                }else{
                    events.publish('PROMISEME');
                }
            });
        }

    },

    moveFiles: function(to, remote, exclude, source){

        var files, sourcePath, toPath, regExp, count, readStream, writeStream;


        if(fs.existsSync(source)){

            if(fs.lstatSync(source).isDirectory()){
                files = fs.readdirSync(source);
                files.forEach(function(file, index){
                    sourcePath = path.join(source, file);
                    toPath = path.join(to, file);

                    if(exclude){
                        regExp = new RegExp('^((?!/' + exclude.map(escapeRegExp).join('|') + ').)*$');
                    }else{
                        regExp = new RegExp('');
                    }

                    if(regExp.test(sourcePath)){

                        if(fs.existsSync(sourcePath)){
                            fsx.copySync(sourcePath, toPath);
                            events.publish('VERBOSE', ['File ' + sourcePath + ' moved to ' + toPath]);
                        }
                    }
                });
            }else{


                if(fs.existsSync(source)){
                    fsx.copySync(source, to);
                    events.publish('VERBOSE', ['File ' + source + ' moved to ' + to]);
                }
            }

        }

        events.publish('PROMISEME');

    }

}
