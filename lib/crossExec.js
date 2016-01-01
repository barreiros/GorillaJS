var path = require('path');
var escapeRegExp = require('escape-string-regexp');
var fs = require('fs');
var fsx = require('fs-extra');
var events = require(__dirname + '/pubsub.js');
var ssh = require(__dirname + '/ssh.js');
var exec = require('child_process').exec;
var execSync = require('child_process').spawnSync;

module.exports = {

    exec: function(command, callback){

        if (ssh.get()) {

            console.log('SSH ', command);

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
            console.log('Normal ', command);

            exec(command, function(err, stdout, stderr){
                callback(err, stdout, stderr);
            });
        }
    },

    execSync: function(command, params, callback){

        var out;

        out = execSync(command, params); 
        callback(
            out.error ? out.error.toString() : null,
            out.stdout ? out.stdout.toString() : null,
            out.stderr ? out.stderr.toString() : null
        );
    },

    moveFiles: function(from, to, remote, exclude){
        events.publish('STEP', ['tools-movefiles']);

        var files, fromPath, toPath, regExp, count, readStream, writeStream;

        if(remote){
            if(ssh.get()){
                events.publish('STEP', ['ssh-sftp']);

                module.exports.exec('mkdir -p ' + to, function(err, stdout, stderr){
                    if (err) events.publish('ERROR', ['015']);
                    events.publish('VERBOSE', [err]);

                    ssh.get().sftp(function(err, sftp){
                        if (err) events.publish('ERROR', ['015']);
                        events.publish('VERBOSE', [err]);

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
                            }else{
                                count += 1;
                            }
                        });
                    });
                });
            }else{
                if (err) events.publish('ERROR', ['015']);
                events.publish('VERBOSE', [err]);
            }
        }else{

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

            events.publish('PROMISEME');
        }
    }
}
