var os = require('os');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var fsx = require('fs-extra');
var yaml = require('yamljs');
var online = require('is-online');
var portscanner = require('portscanner');
var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

var platform;

module.exports = {

    config: function(currentPlatform){

        platform = currentPlatform;

        events.publish('PROMISEME');

    },

    check: function(){

        // Compruebo docker.
        cross.exec('docker ps', function(err, stdout, stderr){

            events.publish('VERBOSE', [stderr + err + stdout]);
            if (err) events.publish('ERROR', ['037']);

            // Compruebo docker-compose.
            cross.exec('docker-compose -v', function(err, stdout, stderr){

                events.publish('VERBOSE', [stderr + err + stdout]);
                if (err) events.publish('ERROR', ['038']);

                events.publish('PROMISEME');

            });


        })

        
    },

    ip: function(machine){

        var out, child;

        out = "127.0.0.1";

        return out;
    },

    getTemplateSource: function(templatesPath, repository, template){

        var command;

        command = 'docker run -v "' + templatesPath + ':/var/gorillajs/templates" gorillajs/alpine /bin/sh -c "cat /var/gorillajs/templates/' + template + '/.git/config"';

        cross.exec(command, function(err, stdout, stderr){

            if(!err){

                command = 'docker run -v "' + templatesPath + ':/var/gorillajs/templates" gorillajs/alpine /bin/sh -c "cd /var/gorillajs/templates/' + template + ' && git fetch origin master && git reset --hard origin/master"';

                cross.exec(command, function(err, stdout, stderr){

                    events.publish('VERBOSE', [stderr]);
                    // if (err) events.publish('ERROR', [stderr]);

                    if(err) events.publish('WARNING', ['014']);

                    events.publish('PROMISEME');

                });

            }else{

                command = 'docker run -v "' + templatesPath + ':/var/gorillajs/templates" gorillajs/alpine /bin/sh -c "git clone ' + repository + ' /var/gorillajs/templates/' + template + '"';

                cross.exec(command, function(err, stdout, stderr){

                    events.publish('VERBOSE', [stderr]);
                    // if (err) events.publish('ERROR', ['041']);
                    if(err) events.publish('WARNING', ['014']);

                    events.publish('PROMISEME');

                });

            }

        });

    },

    logging: function(composeFile, slug, loggingPath, templatePath){

        cross.exec('docker-compose -f "' + composeFile + '" -p ' + slug + ' ps -q', function(err, stdout, stderr){

            events.publish('VERBOSE', [stderr]);
            if (err) events.publish('ERROR', ['029']);

            cross.exec('docker inspect --format="{{.Name}}" ' + stdout.replace(new RegExp('\n', 'g'), ' '), function(err, stdout, stderr){

                var names;

                events.publish('VERBOSE', [stderr]);
                if (err) events.publish('ERROR', ['029']);

                names = getContainersName(stdout);

                fsx.emptyDirSync(loggingPath + '/' + slug);
                for(var key in names){

                    var process;

                    process = spawn('bash', [templatePath + '/logging.sh', names[key], loggingPath + '/' + slug + '/' + names[key]], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    process.unref();

                }

                events.publish('PROMISEME');

            });

        }, false);

    },

    startSimple: function(composeFile, slug){

        cross.exec('docker-compose -f "' + composeFile + '" -p "' + slug + '" up -d', function(err, stdout, stderr){

            events.publish('VERBOSE', [err, stderr, stdout]);
            events.publish('PROMISEME');

        }, false);

    },

    start: function(machine, composeFile, slug, remote){

        var command;

        online(function(err, has){

            if(has){
                
                // cross.exec('docker-compose -f "' + composeFile + '" pull', function(err, stdout, stderr){
                //
                //     // events.publish('VERBOSE', [err, stderr, stdout]);
                //
                //     cross.exec('docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){
                //
                //         // if (err) events.publish('ERROR', ['007']);
                //         events.publish('VERBOSE', [err, stderr, stdout]);
                //         events.publish('PROMISEME');
                //
                //     }, remote);
                // });

                cross.exec('docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){

                    // if (err) events.publish('ERROR', ['007']);
                    events.publish('VERBOSE', [err, stderr, stdout]);
                    events.publish('PROMISEME');

                }, remote);

            }else{

                cross.exec('docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){

                    // if (err) events.publish('ERROR', ['007']);
                    events.publish('VERBOSE', [err, stderr, stdout]);
                    events.publish('PROMISEME');

                }, remote);

            }


        });

    },

    stop: function(gorillaFile, name){

        var data;

        if(fs.existsSync(gorillaFile)){

            data = JSON.parse(fs.readFileSync(gorillaFile));

            name = data.local.project.domain;
            
        }

        cross.exec('docker stop $(docker ps -aq --filter="name=' + name + '") && docker rm $(docker ps -aq --filter="name=' + name + '")', function(err, stdout, stderr){

            // events.publish('VERBOSE', [err, stderr, stdout]);

            events.publish('PROMISEME');

        });

    },

    base: function(composeFile, slug, port){

        cross.exec('docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d', function(err, stdout, stderr){

            events.publish('VERBOSE', [stderr + err + stdout]);

            if (err) {

                portscanner.checkPortStatus(port, function(error, status) {

                    if(status === 'open'){

                        events.publish('ERROR', ['039'])

                    }else{

                        events.publish('ERROR', ['028'])

                    }

                })

            }else{

                events.publish('PROMISEME');

            }


        });
    
    },

    network: function(){

        var container; 

        cross.exec('docker network ls --format="{{.Name}}"', function(err, stdout, stderr){

            if (err) events.publish('ERROR', ['035']);

            containers = getContainersName(stdout);

            if(containers.indexOf('gorillajs') === -1){

                cross.exec('docker network create --driver bridge gorillajs', function(err, stdout, stderr){

                    events.publish('VERBOSE', [stderr + err + stdout]);
                    events.publish('PROMISEME');

                });

            }else{

                events.publish('PROMISEME');

            }

        });

    },

    networking: function(composeFile){

        yaml.load(composeFile, function(file){

            if(file.hasOwnProperty('services')){
                
                var key, objectKeys, connect;

                objectKeys = Object.keys(file.services);
                key = 0;
                connect = function(key){

                    if(file.services[objectKeys[key]].hasOwnProperty('container_name')){

                        cross.exec('docker network connect gorillajs ' + file.services[objectKeys[key]].container_name, function(err, stdout, stderr){

                            events.publish('VERBOSE', [stderr + err + stdout]);

                            key += 1;
                            if(key >= objectKeys.length){

                                events.publish('PROMISEME');

                            }else{

                                connect(key);

                            }

                        });

                    }else{

                        key += 1;
                        if(key >= objectKeys.length){

                            events.publish('PROMISEME');

                        }else{

                            connect(key);

                        }

                    }

                }

                connect(key);

            }else{

                events.publish('PROMISEME');

            }


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

            if(process.platform === 'win32'){

                var child, containers, dataFiltered, matched;

                containers = [];

                child = exec('FOR /f "tokens=*" %i IN (\'docker ps -a -q --filter="name=' + slug + '"\') DO echo {{%i}}');
                child.stderr.on('data', function(err){
                    events.publish('ERROR', ['028']);
                    events.publish('VERBOSE', [err]);
                });
                child.stdout.on('data', function(data){
                    
                    matched = data.match(/\{\{.*?\}\}/g);

                    for(var key in matched){

                        dataFiltered = matched[key].substring(matched[key].lastIndexOf('{{') + 2, matched[key].lastIndexOf('}}'));

                        if(containers.indexOf(dataFiltered) === -1){

                            containers.push(dataFiltered); 

                        }

                    }
                });
                child.on('exit', function(){

                    cross.exec('docker stop ' + containers.join(' ') + ' && docker rm ' + containers.join(' '), function(err, stdout, stderr){

                        events.publish('PROMISEME');

                    });

                });

            }else{

                cross.exec('docker stop $(docker ps -a --filter="name=' + slug + '") && docker rm $(docker ps -a --filter="name=' + slug + '")', function(err, stout, stderr){

                    events.publish('PROMISEME');

                });

            }

        }else{

            events.publish('PROMISEME');

        }

    }

}

function recurrentQuery(query, callback){

}

function getContainersName(list){

    var containers;

    containers = list.split('\n').filter(function(result){

        if(result !== ''){

            return result;

        }

    });

    containers = containers.map(function(result){

        return result.replace('/', '');
        
    });

    return containers;

}
