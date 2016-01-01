var client = require('ssh2').Client;
var fs = require('fs');
var events = require(__dirname + '/pubsub.js');

var conn;

module.exports = {
    
    connect: function(type, host, port, username, password, passphrase){
        events.publish('STEP', ['ssh-connect']);

        var credentials;

        credentials = {
            host: host,
            username: username,
            port: port
        };
        if(type === 'key'){
            credentials['privateKey'] = fs.readFileSync(password.toString());
            credentials['passphrase'] = passphrase;
        }else{
            credentials['password'] = password;
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
