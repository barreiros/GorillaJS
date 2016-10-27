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

        events.publish('PROMISEME');
        
    },

    ip: function(machine){

        var out, child;

        out = "127.0.0.1";

        return out;
    },

    start: function(machine, composeFile, slug, remote){
        events.publish('STEP', ['docker-start']);

        cross.exec('docker-compose -f ' + composeFile + ' -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){
            // if (err) events.publish('ERROR', ['007']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        }, remote);

    },

    stop: function(machine, composeFile, remote){

        cross.exec('docker-compose -f ' + composeFile + ' stop', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['008']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        }, remote);

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

    },

    removeSite: function(basePath, domain, slug){

        if(domain !== '' && slug !== ''){

            if(fs.existsSync(basePath + 'sites-enabled/' + domain + '.conf')){

                fs.unlinkSync(basePath + 'sites-enabled/' + domain + '.conf');

            }

            if(fs.existsSync(basePath + 'sites-available/' + domain + '.conf')){

                fs.unlinkSync(basePath + 'sites-available/' + domain + '.conf');

            }

            cross.exec('docker stop $(docker ps -a --filter="name=' + slug + '") && docker rm $(docker ps -a --filter="name=test")', function(err, stout, stderr){

                events.publish('PROMISEME');

            });

        }else{

            events.publish('PROMISEME');

        }

    }

}
