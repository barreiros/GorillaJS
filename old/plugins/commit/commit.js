/**
 * Plugin name: Commit
 * 
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var destiny, data, container;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(argv._[0] === 'commit'){

            if(argv.hasOwnProperty('c')){

                container = argv.c;

            }else{

                container = data.local.project.domain;

            }

            commit.create(container);

        }

    }

}
