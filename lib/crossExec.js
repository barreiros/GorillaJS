var path = require('path');
var escapeRegExp = require('escape-string-regexp');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var ssh = require(__dirname + '/ssh.js');
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;

module.exports = {

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

    removeFiles: function(to, remote, exclude, files){
        events.publish('STEP', ['tools-removefiles']);

        var count;

        if(remote){
            if(ssh.get()){
                events.publish('STEP', ['ssh-sftp']);
                
                ssh.get().sftp(function(err, sftp){
                    if (err) events.publish('ERROR', ['015']);
                    events.publish('VERBOSE', [err]);

                    if(typeof files === 'object'){

                        if(files.length > 0){
                            count = 0;
                            files.forEach(function(file, index){
                                toPath = path.join(to, file);
                                sftp.unlink(toPath, function(err){
                                    if (err) events.publish('WARNING', ['012']);
                                    events.publish('VERBOSE', [err]);

                                    sftp.readdir(path.dirname(toPath), function(err, list){
                                        events.publish('VERBOSE', [err]);

                                        if(!list){
                                            sftp.rmdir(path.dirname(toPath), function(err){
                                                if (err) events.publish('WARNING', ['011']);
                                                events.publish('VERBOSE', [err]);

                                                count += 1;
                                                if(count === files.length){
                                                    events.publish('PROMISEME');
                                                }
                                            });
                                        }else{
                                            count += 1;
                                            if(count === files.length){
                                                events.publish('PROMISEME');
                                            }
                                        }
                                    });
                                });
                            });
                        }else{
                            events.publish('PROMISEME');
                        }
                    }
                });
            }else{
                events.publish('ERROR', ['010']);
            }
        }
    },

    moveFiles: function(to, remote, exclude, from){
        events.publish('STEP', ['tools-movefiles']);

        var files, fromPath, toPath, regExp, count, readStream, writeStream;

        if(remote){
            if(ssh.get()){
                events.publish('STEP', ['ssh-sftp']);

                module.exports.exec('mkdir -p ' + to + ' && sudo chown ${USER} ' + to, function(err, stdout, stderr){
                    if (err) events.publish('ERROR', ['015']);
                    events.publish('VERBOSE', [err]);

                    ssh.get().sftp(function(err, sftp){
                        if (err) events.publish('ERROR', ['015']);
                        events.publish('VERBOSE', [err]);

                        if(typeof from === 'object'){
                        
                            if(from.length > 0){
                                count = 0;
                                from.forEach(function(file, index){
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
                                                    if(count === from.length){
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
                                            if(count === from.length){
                                                events.publish('PROMISEME');
                                            }
                                        }
                                    }else{
                                        count += 1;
                                        if(count === from.length){
                                            events.publish('PROMISEME');
                                        }
                                    }
                                });
                            }else{
                                events.publish('PROMISEME');
                            }
                        }else if(fs.lstatSync(from).isDirectory()){

                            count = 0;
                            files = fs.readdirSync(from);
                            files.forEach(function(file, index){

                                fromPath = path.join(from, file);
                                toPath = path.join(to, file);

                                if(exclude){
                                    regExp = new RegExp('^((?!/' + exclude.map(escapeRegExp).join('|') + ').)*$');
                                }else{
                                    regExp = new RegExp('');
                                }

                                if(regExp.test(fromPath)){

                                    if(fs.existsSync(fromPath)){
                                        if(sftp.mkdir(path.dirname(toPath))){
                                            if (err) events.publish('ERROR', ['016']);
                                            events.publish('VERBOSE', [err]);

                                            readStream = fs.createReadStream(fromPath);
                                            writeStream = sftp.createWriteStream(toPath);
                                            events.publish('VERBOSE', ['File ' + fromPath + ' moved to remote ' + toPath]);
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
                                readStream = fs.createReadStream(from);
                                writeStream = sftp.createWriteStream(to);
                                events.publish('VERBOSE', ['File ' + from + ' moved to remote ' + to]);
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

            if(fs.lstatSync(from).isDirectory()){
                files = fs.readdirSync(from);
                files.forEach(function(file, index){
                    fromPath = path.join(from, file);
                    toPath = path.join(to, file);

                    if(exclude){
                        regExp = new RegExp('^((?!/' + exclude.map(escapeRegExp).join('|') + ').)*$');
                    }else{
                        regExp = new RegExp('');
                    }

                    if(regExp.test(fromPath)){

                        if(fs.existsSync(fromPath)){
                            fsx.copySync(fromPath, toPath);
                            events.publish('VERBOSE', ['File ' + fromPath + ' moved to ' + toPath]);
                        }
                    }
                });
            }else{
                if(fs.existsSync(from)){
                    fsx.copySync(from, to);
                    events.publish('VERBOSE', ['File ' + from + ' moved to ' + to]);
                }
            }

            events.publish('PROMISEME');
        }
    }
}
