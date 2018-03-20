/**
 * Plugin name: Extra packages
 * Tar command: tar --exclude="./extra_packages/node_modules/" --exclude="./extra_packages/.DS_Store" -zcvf extra_packages.tar.gz extra_packages
 */

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    var argTail, data, promisesPack, container;

    if(fs.existsSync(gorillaFile)){

        if(argv._[0] === 'apk' || argv._[0].search('apt') !== -1 || argv._[0] === 'pacman' || argv._[0] === 'rpm' || argv._[0] === 'yum'){

            promisesPack = [];
            data = JSON.parse(fs.readFileSync(gorillaFile));

            if(argv.hasOwnProperty('c')){

                container = argv.c;
                argTail = process.argv.slice(4).join(' ');

            }else{

                container = data.local.project.domain;
                argTail = process.argv.slice(3).join(' ');

            }

            promisesPack.push(
                [executeCommand, [data.local, argTail, argv._[0], container]],
                [commit.create, data.local.project.domain],
                endProcess
            );

            promises.add(promisesPack);
            promises.start();

        }

    }

}

function executeCommand(data, args, library, container){

    var stdin, term, command, pty;

    pty = require('pty.js');

    command = ['exec', '-it', container, library].concat(args.split(" "));
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

        events.publish('PROMISEME');

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
