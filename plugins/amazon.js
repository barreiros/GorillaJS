'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(__dirname + '/../lib/pubsub.js');

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

                username: "barreiros",
                password: "2000DB",
                image: "test",
                brother: {

                    username: "bunbury",
                    privileges: "admin"

                }
            })

        }

        request.post(options, function(error, response, body){

            console.log(body);

        });

        if(fs.existsSync(gorillaFile)){

            data = JSON.parse(fs.readFileSync(gorillaFile));

        }else{

            events.publish('ERROR', ['030']);

        }

    }

}

