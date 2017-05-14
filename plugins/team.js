/**
 * Plugin name: Team
 * 
 */


'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var token = require(path.join(envPaths.libraries, 'login.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var promisesPack;

    if(argv._[0] === 'clone'){

        // Descargo el proyecto y lo instalo: creo el directorio del proyecto, las bases de datos y las imágenes, si hay.

    }else if(argv._[0] === 'push'){

        promisesPack = [

            [token.login],
            [getPolicy, [gorillaFile, '{{token}}']]

        ];

        promises.sandwich(promisesPack);

    }else if(argv._[0] === 'pull'){

    }

}

function getPolicy(gorillaFile, token){

    var argTail, data, request, options;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        request = require('request');
        options = {
            
            url: 'http://gorillajs.landing/wp-json/amazon/v1/login',
            method: 'POST',
            headers: {

                'Content-type': 'application/json'

            },
            body: JSON.stringify({

                token: token,
                project_id: data.local.project.id

            })

        };

        request.post(options, function(error, response, body){

            console.log(body);

            // serverData = JSON.parse(body);

            // Stop the project to avoid problems with databases.
            // I can use stop, but later if I use start the project dont work.
            // docker-compose -f /Users/barreiros/Documents/workspace/Barreiros_GorillaJS_Landing/.gorilla/template/docker-compose.yml -p "gorillajslanding" stop
            
            // Create a task to package and compress all databases folders separately.
            
            // Create a task to package and compress the project folder.

            // packageProject(data);
            
        });

    }else{

        events.publish('ERROR', ['030']);

    }

}

function packageProject(data){


}
