var fs = require('fs');
var events = require(__dirname + '/pubsub.js');
var ssh = require(__dirname + '/ssh.js');
var exec = require('child_process').exec;
var execSync = require('child_process').spawnSync;

module.exports = {

    exec: function(command, callback){

        if (ssh.get()) {

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
    }
}
