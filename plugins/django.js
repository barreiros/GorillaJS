'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');

var events = require(__dirname + '/../lib/pubsub.js');
var cross = require(__dirname + '/../lib/crossExec.js');
var pty = require('pty.js');
var stdin = process.openStdin();

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var argTail, data;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.local.docker.template === 'django'){

            if(argv._[0] === 'django'){

                if(argv._[1] === 'manage'){

                    argTail = process.argv.slice(4).join(' ');
                    manageDjango(data.local, argTail);

                }

            }

        }

    }else{

        events.publish('ERROR', ['030']);

    }

}

function manageDjango(data, command){

    var term = pty.spawn('docker', ['exec', '-it', data.project.domain, './var/www/' + data.project.domain + '/manage.py', command], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    term.on('data', function(data) {

        process.stdout.write(data);

    });

    term.on('close', function(code) {
        
        process.exit();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

