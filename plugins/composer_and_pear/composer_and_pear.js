/**
 * Plugin name: Composer & PECL
 * 
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

    var argTail, data, promisesPack;

    if(fs.existsSync(gorillaFile)){

        promisesPack = [];

        data = JSON.parse(fs.readFileSync(gorillaFile));

        if(argv._[0] === 'composer'){

            argTail = process.argv.slice(3).join(' ');

            promisesPack.push(
                [events.publish, ['STEP', ['Checking for PECL, PEAR and Composer updates...']]],
                [installDependencies, [data.local]],
                [composerPHP, [data.local, argTail]]
            );

            promises.add(promisesPack);
            promises.start();

        }else if(argv._[0] === 'pecl' || argv._[0] === 'pear'){

            argTail = process.argv.slice(3).join(' ');

            promisesPack.push(
                [events.publish, ['STEP', ['Checking for PECL, PEAR and Composer updates...']]],
                [installDependencies, [data.local]],
                [peclPHP, [data.local, argTail, argv._[0]]],
                [commit.create, data.local.project.domain],
                endProcess
            );

            promises.add(promisesPack);
            promises.start();

        }

    }

}

function peclPHP(data, args, library){

    var stdin, term, command, pty;

    pty = require('pty.js');

    command = ['exec', '-it', data.project.domain, library].concat(args.split(" "));
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

function composerPHP(data, args){

    var stdin, term, command, pty;

    pty = require('pty.js');

    command = ['exec', '-it', data.project.domain, '/usr/local/bin/composer.phar', '--working-dir=' + path.join('var', 'www', data.project.domain, 'application')].concat(args.split(" "));
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

function installDependencies(data){

    cross.exec('docker cp "' + envPaths.plugins + '/composer_and_pear/server/." ' + data.project.domain + ':/etc/composer_and_pear', function(err, stdout, stderr){

        cross.exec('docker exec ' + data.project.domain + ' /bin/sh /etc/composer_and_pear/dependencies.sh', function(err, stdout, stderr){

            events.publish('VERBOSE', [err, stderr, stdout]);
            if (err) events.publish('ERROR', ['Unable to install Composer and PECL dependencies']);

            events.publish('PROMISEME');
            
        });

    });

}

function endProcess(){

    // Termino el proceso de NodeJS.
    process.stdin.destroy();
    process.exit();

}
