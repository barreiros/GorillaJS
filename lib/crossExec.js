var path = require('path');
var escapeRegExp = require('escape-string-regexp');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var ssh = require(__dirname + '/ssh.js');
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;

var projectPath;

module.exports = {

    config: function(path){
        projectPath = path;

        events.publish('PROMISEME');
    },

    exec: function(command, callback, remote){

        if (remote){
            if (ssh.get()) {
                events.publish('VERBOSE', ['SSH: ' + command]);

                ssh.get().exec(command, function(err, stream){

                    var stdout, stderr;

                    stdout = '';
                    stderr = '';
                    if(err){
                        callback(err);
                    }else{
                        stream.on('data', function(data, err) {
                            if(err){
                                stdout += data.toString();
                                callback(err, stdout); 
                            }else{
                                stdout += data.toString();
                            }
                        });
                        stream.on('close', function(){
                            callback(null, stdout, stderr);
                        });
                        stream.stderr.on('data', function(data){
                            stderr += data.toString();
                        });
                    }
                });
            }else{
                events.publish('ERROR', ['010']);
            }
        }else{
            events.publish('VERBOSE', ['LOCAL: ' + command]);

            exec(command, function(err, stdout, stderr){
                callback(err, stdout, stderr);
            });
        }
    },

    spawnSync: function(command, params, callback){

        var out;

        out = spawnSync(command, params); 
        if(callback){
            callback(
                out.error ? out.error.toString() : null,
                out.stdout ? out.stdout.toString() : null,
                out.stderr ? out.stderr.toString() : null
            );
        }else{
            return out.stdout;
        }
    },

    removeFiles: function(to, remote, exclude, source){
        events.publish('STEP', ['tools-removefiles']);

        var count, toPath, files;

        if(remote){
            if(ssh.get()){
                events.publish('STEP', ['ssh-sftp']);
                
                ssh.get().sftp(function(err, sftp){
                    if (err) events.publish('ERROR', ['015']);
                    events.publish('VERBOSE', [err]);

                    if(typeof source === 'object'){

                        if(source.length > 0){
                            count = 0;
                            source.forEach(function(file, index){
                                toPath = path.join(to, file);
                                sftp.unlink(toPath, function(err){
                                    if (err) events.publish('WARNING', ['012']);
                                    events.publish('VERBOSE', [err]);

                                    sftp.readdir(path.dirname(toPath), function(err, list){
                                        events.publish('VERBOSE', [err]);

                                        if(list){
                                            if(list.length === 0){
                                                sftp.rmdir(path.dirname(toPath), function(err){
                                                    if (err) events.publish('WARNING', ['011']);
                                                    events.publish('VERBOSE', [err]);

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
                                        }else{
                                            count += 1;
                                            if(count === source.length){
                                                events.publish('PROMISEME');
                                            }
                                        }
                                    });
                                });
                            });
                        }else{
                            events.publish('PROMISEME');
                        }
                    }else{
                        events.publish('PROMISEME');
                    }
                });
            }else{
                events.publish('ERROR', ['010']);
            }
        }else{
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
        }
    },

    moveFiles: function(to, remote, exclude, source){
        events.publish('STEP', ['tools-movefiles']);

        var files, sourcePath, toPath, regExp, count, readStream, writeStream;

        if(remote){
            if(ssh.get()){
                events.publish('STEP', ['ssh-sftp']);

                module.exports.exec('mkdir -p ' + to + ' && sudo chown ${USER} ' + to, function(err, stdout, stderr){
                    if (err) events.publish('ERROR', ['015']);
                    events.publish('VERBOSE', [err]);

                    ssh.get().sftp(function(err, sftp){
                        if (err) events.publish('ERROR', ['015']);
                        events.publish('VERBOSE', [err]);

                        if(typeof source === 'object'){
                        
                            if(source.length > 0){
                                count = 0;
                                source.forEach(function(file, index){
                                    toPath = path.join(to, file);

                                    if(exclude){
                                        regExp = new RegExp('^((?!/' + exclude.map(escapeRegExp).join('|') + ').)*$');
                                    }else{
                                        regExp = new RegExp('');
                                    }

                                    if(regExp.test(file)){
                                        if(fs.existsSync(file)){
                                            if(sftp.mkdir(path.dirname(toPath))){
                                                if (err) events.publish('ERROR', ['016']);
                                                events.publish('VERBOSE', [err]);

                                                events.publish('VERBOSE', ['File ' + file + ' moved to remote ' + toPath]);
                                                readStream = fs.createReadStream(file);
                                                writeStream = sftp.createWriteStream(toPath);
                                                writeStream.on('close', function(){
                                                    count += 1;
                                                    if(count === source.length){
                                                        events.publish('PROMISEME');
                                                    }
                                                });
                                                writeStream.on('error', function(err){
                                                    if (err) events.publish('ERROR', ['016']);
                                                    events.publish('VERBOSE', [err]);
                                                });
                                                readStream.pipe(writeStream);
                                            }
                                        }else{
                                            count += 1;
                                            if(count === source.length){
                                                events.publish('PROMISEME');
                                            }
                                        }
                                    }else{
                                        count += 1;
                                        if(count === source.length){
                                            events.publish('PROMISEME');
                                        }
                                    }
                                });
                            }else{
                                events.publish('PROMISEME');
                            }
                        }else if(fs.lstatSync(source).isDirectory()){

                            count = 0;
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
                                        if(sftp.mkdir(path.dirname(toPath))){
                                            if (err) events.publish('ERROR', ['016']);
                                            events.publish('VERBOSE', [err]);

                                            readStream = fs.createReadStream(sourcePath);
                                            writeStream = sftp.createWriteStream(toPath);
                                            events.publish('VERBOSE', ['File ' + sourcePath + ' moved to remote ' + toPath]);
                                            writeStream.on('close', function(){
                                                count += 1;

                                                if(count === files.length){
                                                    events.publish('PROMISEME');
                                                }
                                            });
                                            writeStream.on('error', function(err){
                                                if (err) events.publish('ERROR', ['016']);
                                                events.publish('VERBOSE', [err]);
                                            });
                                            readStream.pipe(writeStream);
                                        }
                                    }
                                }else{
                                    count += 1;
                                }
                            });
                        }else{
                            if(sftp.mkdir(path.dirname(to))){
                                readStream = fs.createReadStream(source);
                                writeStream = sftp.createWriteStream(to);
                                events.publish('VERBOSE', ['File ' + source + ' moved to remote ' + to]);
                                writeStream.on('close', function(){
                                    events.publish('PROMISEME');
                                });
                                writeStream.on('error', function(err){
                                    if (err) events.publish('ERROR', ['016']);
                                    events.publish('VERBOSE', [err]);
                                });
                                readStream.pipe(writeStream);
                            }else{
                                events.publish('ERROR', ['016']);
                            }
                        }
                    });
                }, true);
            }else{
                events.publish('ERROR', ['010']);
            }
        }else{

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

            events.publish('PROMISEME');
        }
    }
}
