var os = require('os');
var events = require(__dirname + '/pubsub.js');
var cross = require(__dirname + '/crossExec.js');
var fs = require('fs');
var yaml = require('yamljs');

var platform;

module.exports = {

    config: function(currentPlatform){
        platform = currentPlatform;

        events.publish('PROMISEME');
    },

    check: function(machine, remote){
        events.publish('STEP', ['docker-checkplatform']);

        if(platform === 'windows'){
            cross.exec('docker-machine status ' + machine, function(err, stdout, stderr){

                if(err){

                    cross.exec('docker-machine create ' + machine + ' --driver virtualbox', function(err, stdout, stderr){
                        // if (err) events.publish('ERROR', ['007']);
                        events.publish('VERBOSE', [stderr]);

                        events.publish('PROMISEME');

                    }, remote);
                }else{

                    cross.exec('docker-machine start ' + machine, function(err, stdout, stderr){
                        events.publish('VERBOSE', [stderr]);

                        events.publish('PROMISEME');

                    }, remote);

                }

            }, remote);
        }else{
            events.publish('PROMISEME');
        }
        
    },

    ip: function(machine){

        var out, child;

        if(platform === 'windows'){
            cross.spawnSync('docker-machine', ['start', machine], function(err, stdout, stderr){
                if (err) events.publish('WARNING', ['008']);
                events.publish('VERBOSE', [stderr]);

                cross.spawnSync('eval', ['$(docker-machine env ' + machine], function(err, stdout, stderr){
                    cross.spawnSync('docker-machine', ['ip', machine], function(err, stdout, stderr){
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

    start: function(machine, composeFile, slug, remote){
        events.publish('STEP', ['docker-start']);

        if(platform === 'windows'){

            cross.exec('eval $(docker-machine env ' + machine + ') && docker-compose -f ' + composeFile + ' -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){
                // if (err) events.publish('ERROR', ['007']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            }, remote);
        }else{

            cross.exec('docker-compose -f ' + composeFile + ' -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){
                // if (err) events.publish('ERROR', ['007']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            }, remote);
        }
    },

    stop: function(machine, composeFile, remote){

        if(platform === 'windows'){
            cross.exec('eval $(docker-machine env ' + machine + ') && docker-compose -f ' + composeFile + ' stop', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['008']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            }, remote);
        }else{
            cross.exec('docker-compose -f ' + composeFile + ' stop', function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['008']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            }, remote);
        }
    },

    base: function(port, composeFile, slug){

        cross.exec('docker-compose -f ' + composeFile + ' -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['028']);
            events.publish('VERBOSE', [stderr + err + stdout]);

            events.publish('PROMISEME');

        });
    
    },

    checkContainers: function(composeFile){

        yaml.load(composeFile, function(file){

            cross.exec('docker inspect --format="{{.Name}}" $(docker ps -q)', function(err, stdout, stderr){

                var containers, resultFiltered;

                containers = stdout.split('\n').filter(function(result){

                    if(result !== '' && result !== '/gorillajsproxy'){

                        return result;

                    }

                });

                containers = containers.map(function(result){

                    return result.replace('/', '');
                    
                });

                file.proxy['external_links'] = containers;
                fs.writeFileSync(composeFile, yaml.stringify(file, 6));

                events.publish('PROMISEME');

            });


        });

    }

}
