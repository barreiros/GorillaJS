var client = require('ssh2').Client;
var fs = require('fs');
var events = require(__dirname + '/pubsub.js');

var conn;

module.exports = {
    
    connect: function(args){
        events.publish('STEP', ['ssh-connect']);

        var credentials;

        credentials = {
            host: args[1],
            username: args[3],
            port: args[2]
        };
        if(args[0] === 'key'){
            credentials['privateKey'] = fs.readFileSync(args[4]).toString();
            credentials['passphrase'] = args[5];
        }else{
            credentials['password'] = args[4];
        }

        conn = new client();
        conn.on('ready', function(){
            events.publish('PROMISEME');
        });
        conn.on('error', function(err){
            events.publish('VERBOSE', [err.toString()]);
        });
        try{
            conn.connect(credentials);
        }catch(err){
            if (err) events.publish('ERROR', ['010']);
            events.publish('VERBOSE', [err.toString()]);
        }
    },

    interactive: function(){
        events.publish('STEP', ['ssh-interactive']);

        conn.shell(function(err, stream){
            if (err) events.publish('ERROR', ['010']);

            stream.on('close', function(){
                console.log('Interactive session closed');
                events.publish('PROMISEME');
            });
            stream.on('data', function(data){
                console.log(data.toString());
            });
            stream.stderr.on('data', function(data){
                console.log(data.toString());
            });
            // stream.end('ls -l\nexit\n');
        });
    },

    close: function(){
        conn.end();
    },

    get: function(){
        return conn;
    },

}
