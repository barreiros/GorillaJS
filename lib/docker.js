var os = require('os');
var events = require(__dirname + '/pubsub.js');
var cross = require(__dirname + '/crossExec.js');

var platform;

module.exports = {

    config: function(currentPlatform){
        platform = currentPlatform;

        events.publish('PROMISEME');
    },

    check: function(machine){
        events.publish('STEP', ['docker-checkplatform']);

        if(platform !== 'linux'){
            cross.exec('docker-machine start ' + machine, function(err, stdout, stderr){
                if (err) events.publish('WARNING', ['008']);
                events.publish('VERBOSE', [stderr]);

                cross.exec('eval $(docker-machine env ' + machine + ')', function(err, stdout, stderr){
                    if (err) events.publish('WARNING', ['007']);
                    events.publish('VERBOSE', [stderr]);

                    events.publish('PROMISEME');
                });
            });
        }else{
            events.publish('PROMISEME');
        }
    },
    ip: function(machine){

        var out, child;

        if(platform !== 'linux'){
            cross.execSync('docker-machine', ['start', machine], function(err, stdout, stderr){
                if (err) events.publish('WARNING', ['008']);
                events.publish('VERBOSE', [stderr]);

                cross.execSync('eval', ['$(docker-machine env ' + machine], function(err, stdout, stderr){
                    cross.execSync('docker-machine', ['ip', machine], function(err, stdout, stderr){
                        if (err) events.publish('ERROR', ['013']);
                        events.publish('VERBOSE', [stderr]);

                        out = stdout.replace('\n', '');
                    });
                });
            });
        }else{
            out = "127.0.0.1";
        }

        return out;
    },
    start: function(args){
        events.publish('STEP', ['docker-start']);

        if(platform !== 'linux'){
            cross.exec('eval $(docker-machine env ' + args[0] + ') && docker-compose -f ' + args[1] + ' -p ' + args[2] + ' up --force-recreate -d', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['007']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            });
        }else{
            cross.exec('docker-compose -f ' + args[1] + ' up -d', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['007']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            });

        }
    },
    stop: function(args){

        if(platform !== 'linux'){
            cross.exec('eval $(docker-machine env ' + args[0] + ') && docker-compose -f ' + args[1] + ' stop', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['008']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            });
        }else{
            cross.exec('docker-compose -f ' + args[1] + ' stop', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['008']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            });

        }
    }
}
