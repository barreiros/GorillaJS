var fs = require('fs');
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

    moveFiles: function(from, to, sftp){
        events.publish('STEP', ['tools-movefiles']);

        if(sftp){
            if(ssh.get()){

            }else{

            }
        }else{

            // var files, stats, fromPath, toPath, regExp;
            //
            // files = fs.readdirSync(args[0]);
            // files.forEach(function(file, index){
            //     fromPath = path.join(args[0], file);
            //     toPath = path.join(args[1], file);
            //
            //     if(args[2]){
            //         regExp = new RegExp('^((?!/' + args[2].map(escapeRegExp).join('|') + ').)*$');
            //     }else{
            //         regExp = new RegExp('');
            //     }
            //
            //     if(regExp.test(fromPath)){
            //
            //         stats = fs.existsSync(fromPath);
            //
            //         if(stats){
            //             stats = fsx.copySync(fromPath, toPath);
            //         }
            //     }
            // });
            //
            // events.publish('PROMISEME');
        }
    }
}
