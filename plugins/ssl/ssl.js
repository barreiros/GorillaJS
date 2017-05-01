/**
 * Plugin name: SSL
 * 
 */

'use strict';

var path = require('path');
var fs = require('fs');
var fsx = require('fs-extra');
var yaml = require('yamljs');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

var sslEnabled = false;

events.subscribe('DOMAIN_SELECTED', init);
events.subscribe('BEFORE_SET_PROXY_VARIABLES', modifyProxyBefore);
events.subscribe('AFTER_SET_PROXY_VARIABLES', modifyProxyAfter);
events.subscribe('DOCKER_STARTED', configureDocker);

function init(domain){

    var promisesPack;

    promisesPack = [

        [tools.param, ['proxy', 'sslport'], 'proxysslport'],
        [tools.param, ['project', 'sslenable', ['no', 'yes']], 'sslenable'],

        [promises.cond, '{{sslenable}}::yes', [

            [tools.paramForced, ['project', 'protocol', 'https'], 'protocol'],
            [promises.cond, '{{islocal}}::yes', [

                [tools.paramForced, ['project', 'sslemail', false]]

            ], [

                [tools.param, ['project', 'sslemail'], 'sslemail']

            ]]

        ], [

            [tools.paramForced, ['project', 'sslemail', false]],
            [tools.paramForced, ['project', 'protocol', 'http'], 'protocol']

        ]]

    ];
    promises.sandwich(promisesPack);

}

function modifyProxyBefore(gorillaFile, proxyPath){

    var promisesPack;

    promisesPack = [

        [promises.cond, '{{sslenable}}::yes', [

            [copySSLFiles, proxyPath]

        ]]

    ];

    promises.sandwich(promisesPack);

}

function modifyProxyAfter(gorillaFile, proxyPath){

    var promisesPack;

    promisesPack = [

        [tools.param, ['proxy', 'sslport'], 'proxysslport'],
        [tools.param, ['project', 'sslenable', ['no', 'yes']], 'sslenable'],

        [promises.cond, '{{sslenable}}::yes', [

            [addSSL, [gorillaFile, proxyPath, '{{proxysslport}}']]

        ]]

    ];

    promises.sandwich(promisesPack);

}

function copySSLFiles(proxyPath){

    fsx.copySync(path.join(envPaths.plugins, 'ssl', 'server'), proxyPath);

    events.publish('PROMISEME');

}

function addSSL(gorillaFile, proxyPath, port){

    var data, composeFile;

    sslEnabled = true;
    data = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = proxyPath + '/docker-compose.yml';

    yaml.load(composeFile, function(file){

        file.services.proxy.ports.push(port + ':443');
        file.services.proxy.volumes.push(data.local.proxy.userpath + '/letsencrypt:/etc/letsencrypt');

        fs.writeFileSync(composeFile, yaml.stringify(file, 6)); 

        events.publish('PROMISEME');

    });

}

function configureDocker(){

    if(sslEnabled){

        // Ejecuto el script de bash de configuración.
        cross.exec('docker exec gorillajsproxy /bin/sh /root/templates/ssl.sh', function(err, stdout, stderr){

            console.log(err, stdout, stderr);

        });

    }

}

