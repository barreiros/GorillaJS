/**
 * Plugin name: Amazon
 * 
 */


'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var argTail, data, request, options;

    if(argv._[0] === 'share'){

        request = require('request');
        options = {
            
            url: 'http://gorillajs.landing/wp-json/amazon/v1/share',
            method: 'POST',
            headers: {

                'Content-type': 'application/json'

            },
            body: JSON.stringify({

                username: 'barri',
                password: '02528',
                image_name: 'test',
                project_id: '99fc8f21-bfd8-4609-ba19-085e1f46f1a4',
                brother: {

                    username: 'bunbury',
                    privileges: 'admin'

                }
            })

        }

        request.post(options, function(error, response, body){

            var data; 

            serverData = JSON.parse(body);
            console.log(gorillaFile);
            console.log(serverData);

            // Stop the project to avoid problems with databases.
            // I can use stop, but later if I use start the project dont work.
            // docker-compose -f /Users/barreiros/Documents/workspace/Barreiros_GorillaJS_Landing/.gorilla/template/docker-compose.yml -p "gorillajslanding" stop
            
            // Create a task to package and compress all databases folders separately.
            
            // Create a task to package and compress the project folder.
            
            //
        });

        if(fs.existsSync(gorillaFile)){

            data = JSON.parse(fs.readFileSync(gorillaFile));

        }else{

            events.publish('ERROR', ['030']);

        }

    }

}

