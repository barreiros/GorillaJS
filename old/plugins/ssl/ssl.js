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
var commit = require(path.join(envPaths.libraries, 'commit.js'));

var sslEnabled = false;

events.subscribe('DOMAIN_SELECTED', init);
events.subscribe('BEFORE_SET_PROXY_VARIABLES', modifyProxyBefore);
events.subscribe('BEFORE_SET_TEMPLATE_VARIABLES', beforeSetTemplateVariables);
events.subscribe('AFTER_SET_PROXY_VARIABLES', modifyProxyAfter);
events.subscribe('AFTER_SET_TEMPLATE_VARIABLES', afterSetTemplateVariables);
events.subscribe('DOCKER_STARTED', setConfiguration);

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

        ]]

    ];
    promises.sandwich(promisesPack);

}

function modifyProxyBefore(gorillaFile, proxyPath){

    var promisesPack;

    promisesPack = [

        [copySSLFiles, proxyPath]

    ];

    promises.sandwich(promisesPack);

}

function modifyProxyAfter(gorillaFile, proxyPath){

    var promisesPack;

    promisesPack = [

        [tools.param, ['proxy', 'sslport'], 'proxysslport'],
        [tools.param, ['project', 'sslenable', ['no', 'yes']], 'sslenable'],
        [addSSL, [gorillaFile, proxyPath, '{{proxysslport}}']]

    ];

    promises.sandwich(promisesPack);

}

function beforeSetTemplateVariables(gorillaFile, templatePath){

    var promisesPack;

    promisesPack = [

        [copySSLAppFiles, [gorillaFile, templatePath]] 

    ];

    promises.sandwich(promisesPack);

}

function afterSetTemplateVariables(gorillaFile, templatePath){

    var promisesPack;

    promisesPack = [

        [checkRootTemplatesPath, [gorillaFile, templatePath]]

    ];

    promises.sandwich(promisesPack);

}

function checkRootTemplatesPath(gorillaFile, templatePath){

    var composeFile, settings;

    settings = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = path.join(templatePath, variables.composeFile);

    if(settings.local.docker.template_type === 'Local folder' || settings.local.docker.template_type === 'External repository'){

        yaml.load(composeFile, function(file){

            var isValidFile;

            // Compruebo el árbol del archivo docker-compose para localizar el contenedor correcto basándome en el nombre.
            if(file.hasOwnProperty('services')){

                for(var service in file.services){

                    // Si tienen la propiedad container_name
                    if(file.services[service].hasOwnProperty('container_name')){

                        if(file.services[service].container_name = settings.local.project.domain){

                            // Encuentro el servicio principal, que siempre tiene que ser el que tenga el nombre de dominio como nombre del contenedor.
                            // Compruebo si tiene un volumen compartido.
                            
                            if(file.services[service].volumes){

                                if(file.services[service].volumes.indexOf('../template:/root/templates') === -1){

                                    file.services[service].volumes.push('../template:/root/templates');

                                }

                            }else{

                                // Si no lo tiene, creo el nodo y añado el volumen.
                                file.services[service].volumes = ['../template:/root/templates'];

                            }

                            fs.writeFileSync(composeFile, yaml.stringify(file, 6)); 
                            isValidFile = true;

                            break;

                        }

                    }

                }

            }else{

                isValidFile = false;

            }

            if(isValidFile){

                events.publish('PROMISEME');

            }else{

                events.publish('ERROR', ['docker-compose.yml file not valid. Please, check the docs and try again.']);

            }

        });

    }else{

        events.publish('PROMISEME');

    }

}

function copySSLAppFiles(gorillaFile, templatePath){

    var settings;

    settings = JSON.parse(fs.readFileSync(gorillaFile));

    if(fs.existsSync(path.join(envPaths.plugins, 'ssl', 'app_' + settings.local.docker.template_type + '.sh'))){

        fsx.copySync(path.join(envPaths.plugins, 'ssl', 'app_' + settings.local.docker.template_type + '.sh'), path.join(templatePath, 'ssl.sh'));

    }else{

        fsx.copySync(path.join(envPaths.plugins, 'ssl', 'app.sh'), path.join(templatePath, 'ssl.sh'));

    }

    events.publish('PROMISEME');

}

function copySSLFiles(proxyPath){

    fsx.copySync(path.join(envPaths.plugins, 'ssl', 'server'), proxyPath);

    events.publish('PROMISEME');

}

function addSSL(gorillaFile, proxyPath, port){

    var data, composeFile;

    data = JSON.parse(fs.readFileSync(gorillaFile));
    composeFile = proxyPath + '/docker-compose.yml';

    yaml.load(composeFile, function(file){

        file.services.proxy.ports.push(port + ':443');
        file.services.proxy.volumes.push(data.local.proxy.userpath + '/letsencrypt:/etc/letsencrypt');

        fs.writeFileSync(composeFile, yaml.stringify(file, 6)); 

        events.publish('PROMISEME');

    });

}

function setConfiguration(){

    var promisesPack;

    promisesPack = [

        [configureProxy],
        [configureApp],
        [commit.create, 'gorillajsproxy']

    ];

    promises.sandwich(promisesPack);

}

function configureProxy(){

    // Ejecuto el script de bash de configuración.
    cross.exec('docker exec gorillajsproxy /bin/sh /root/templates/ssl.sh', function(err, stdout, stderr){

        events.publish('VERBOSE', [err, stderr, stdout]);

        events.publish('PROMISEME');

    });

}

function configureApp(){

    var settings;

    settings = JSON.parse(fs.readFileSync(path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaFile)));

    // Ejecuto el script de bash de configuración.
    cross.exec('docker exec ' + settings.local.project.domain + ' /bin/sh /root/templates/ssl.sh', function(err, stdout, stderr){

        events.publish('VERBOSE', [err, stderr, stdout]);

        events.publish('PROMISEME');

    });

}

