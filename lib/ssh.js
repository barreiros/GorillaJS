var client = require('ssh2').Client;
var fs = require('fs');
var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));

var conn;

module.exports = {
    
    connect: function(host, port, username, key, passphrase){

        var credentials;

        credentials = {
            host: host,
            username: username,
            port: port
        };
        credentials['privateKey'] = fs.readFileSync(key.toString());
        credentials['passphrase'] = passphrase;

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
            stream.write('sudo apt-get update');
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
