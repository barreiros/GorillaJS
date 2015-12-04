var os = require('os');
var events = require(__dirname + '/pubsub.js');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

var hostIp;

module.exports = {

    check: function(machine){

        if(os.platform !== 'linux'){
            exec('docker-machine start ' + machine, function(err, stdout, stderr){
                if (err) console.log(err);

                exec('eval $(docker-machine env ' + machine + ')', function(err, stdout, stderr){
                    if (err) console.log(err);

                    events.publish('PROMISEME');
                });

            });
        }else{
            events.publish('PROMISEME');
        }
    },
    ip: function(machine){

        var out, child;

        if(os.platform !== 'linux'){
            out = execSync('eval $(docker-machine env ' + machine + ') && docker-machine ip ' + machine).toString().replace('\n', '');
        }else{
            out = "127.0.0.1";
        }

        return out;
    },
    start: function(args){

        if(os.platform !== 'linux'){
            exec('eval $(docker-machine env ' + args[0] + ') && docker-compose -f ' + args[1] + ' up -d', function(err, stdout, stderr){
                if (err) console.log(err);

                events.publish('PROMISEME');
            });
        }else{
            exec('docker-compose -f ' + args[1] + ' up -d', function(err, stdout, stderr){
                if (err) console.log(err);

                events.publish('PROMISEME');
            });

        }
    },
    stop: function(args){

        if(os.platform !== 'linux'){
            exec('eval $(docker-machine env ' + args[0] + ') && docker-compose -f ' + args[1] + ' stop', function(err, stdout, stderr){
                if (err) console.log(err);

                events.publish('PROMISEME');
            });
        }else{
            exec('docker-compose -f ' + args[1] + ' stop', function(err, stdout, stderr){
                if (err) console.log(err);

                events.publish('PROMISEME');
            });

        }
    }
}
