'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

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
                            if(destiny){

                                dbImport(data.local, destiny);

                            }else{

                                events.publish('ERROR', ['031']);

                            }

                            break;

                        case 'export':

                            destiny = argv._.hasOwnProperty(3) ? argv._[3] : process.cwd() + '/' + Date.now() + '.sql';
                            dbExport(data.local, destiny);

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

function dbExport(data, destiny){
    
    cross.exec('docker exec -i ' + data.project.slug + '_mysql mysqldump -u' + data.database.username + ' -p' + data.database.password + ' ' + data.database.dbname + ' > ' + destiny, function(err, stdout, stderr){

    });

}

function dbImport(data, file){

}

function projectClone(){

}
