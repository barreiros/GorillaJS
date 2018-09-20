/**
 * Plugin name: Django manage
 * 
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var pty = require('pty.js');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var argTail, data, promisesPack;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(data.local.hasOwnProperty('docker')){

            if(argv._[0] === 'manage'){

                argTail = process.argv.slice(3).join(' ');

                promisesPack = [];

                promisesPack.push(
                    [manageDjango, [data.local, argTail]],
                    [commit.create, data.local.project.domain],
                    endProcess
                );

                promises.add(promisesPack);
                promises.start();

            }else if(argv._[0] === 'pip'){

                promisesPack = [];

                argTail = process.argv.slice(3).join(' ');

                promisesPack.push(
                    [managePip, [data.local, argTail]],
                    [commit.create, data.local.project.domain],
                    endProcess
                );

                promises.add(promisesPack);
                promises.start();

            }

        }

    }

}

function saveRequirements(data){

    cross.exec('docker exec -i ' + data.project.domain + ' pip3 freeze > src/requirements.txt', function(err, stdout, stderr){

        if (err) console.log(stderr, err, stdout);

        events.publish('PROMISEME');

    });

}

function managePip(data, args){

    var stdin, term, command;

    command = ['exec', '-it', data.project.domain, 'pip3'].concat(args.split(" "));
    stdin = process.openStdin();

    term = pty.spawn('docker', command, {
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
        process.stdin.destroy();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

function manageDjango(data, command){

    var stdin, term;

    stdin = process.openStdin();
    term = pty.spawn('docker', ['exec', '-it', data.project.domain, 'python3', '/var/www/' + data.project.domain + '/manage.py', command], {
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
        process.stdin.destroy();

    });

    stdin.addListener('data', function(data){

        term.write(data.toString());

    });

}

function endProcess(){

    // Termino el proceso de NodeJS.
    process.stdin.destroy();
    process.exit();

}
