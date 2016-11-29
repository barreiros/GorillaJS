'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');

var events = require(__dirname + '/../lib/pubsub.js');
var cross = require(__dirname + '/../lib/crossExec.js');

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var destiny, data;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(argv._[0] === 'wordpress'){

            if(argv._[1] === 'db'){

                if(argv._.hasOwnProperty(2)){

                    switch(argv._[2]){

                        case 'import':

                            destiny = argv._.hasOwnProperty(3) ? argv._[3] : null;

                            if(destiny && data.hasOwnProperty('local')){

                                dbImport(data.local, destiny);

                            }else{

                                events.publish('ERROR', ['030']);

                            }

                            break;

                        case 'replace':

                            destiny = argv._.hasOwnProperty(3) ? argv._[3] : null;

                            if(destiny && data.hasOwnProperty('local')){

                                dbReplace(data.local, destiny);

                            }else{

                                events.publish('ERROR', ['030']);

                            }

                            break;

                        case 'export':

                            if(data.hasOwnProperty('local')){

                                destiny = argv._.hasOwnProperty(3) ? argv._[3] : process.cwd() + '/' + Date.now() + '.sql';
                                dbExport(data.local, destiny);

                            }else{

                                events.publish('ERROR', ['030']);

                            }

                            break;

                    }
                }

            }else if(argv._[1] === 'clone'){

            }

        }

    }else{

        events.publish('ERROR', ['030']);

    }

}

function dbImport(data, file){

    if(data.hasOwnProperty('project') && data.hasOwnProperty('database')){


        cross.exec('docker exec -i ' + data.project.slug + '_mysql mysql --force -u' + data.database.username + ' -p' + data.database.password + ' ' + data.database.dbname + ' < "' + file + '"', function(err, stdout, stderr){

            events.publish('VERBOSE', [stderr + err + stdout]);
            if (err) events.publish('ERROR', ['032']);

        });

    }else{

        events.publish('ERROR', ['030']);

    }

}

function dbReplace(data, file){

    if(data.hasOwnProperty('project') && data.hasOwnProperty('database')){


        cross.exec('docker exec -i ' + data.project.slug + '_mysql mysql -u' + data.database.username + ' -p' + data.database.password + ' -e "DROP DATABASE ' + data.database.dbname + '"', function(err, stdout, stderr){


            if (err) {

                events.publish('VERBOSE', [stderr + err + stdout]);
                events.publish('ERROR', ['032']);

            }else{

                cross.exec('docker exec -i ' + data.project.slug + '_mysql mysql -u' + data.database.username + ' -p' + data.database.password + ' -e "CREATE DATABASE ' + data.database.dbname + '"', function(err, stdout, stderr){

                    if (err) {

                        events.publish('VERBOSE', [stderr + err + stdout]);
                        events.publish('ERROR', ['032']);

                    }else{

                        cross.exec('docker exec -i ' + data.project.slug + '_mysql mysql --force -u' + data.database.username + ' -p' + data.database.password + ' ' + data.database.dbname + ' < "' + file + '"', function(err, stdout, stderr){

                            events.publish('VERBOSE', [stderr + err + stdout]);
                            if (err) events.publish('ERROR', ['032']);

                        });

                    }

                });

            }

        });

    }else{

        events.publish('ERROR', ['030']);

    }

}

function dbExport(data, destiny){
    
    if(data.hasOwnProperty('project') && data.hasOwnProperty('database')){

        if(!fs.existsSync(path.dirname(destiny))){

            fs.mkdirSync(path.dirname(destiny));

        }

        cross.exec('docker exec -i ' + data.project.slug + '_mysql mysqldump -u' + data.database.username + ' -p' + data.database.password + ' ' + data.database.dbname + ' > ' + destiny, function(err, stdout, stderr){

            events.publish('VERBOSE', [stderr + err + stdout]);
            if (err) events.publish('ERROR', ['032']);

        });

    }else{

        events.publish('ERROR', ['030']);

    }

}
