'use strict';

var path = require('path');
var fs = require('fs');
var split = require('split');
var checkIp = require('ip');
var openUrl = require('open');
var request = require('request');
var keypair = require('keypair');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));

var attempts = 0;

module.exports = {

    createSSHKeys: function(templatePath){

        var keys, stream;

        // Creo las claves pública y privada.
        keys = keypair();

        // Las guardo en la carpeta de la plantilla.
        fs.writeFileSync(path.join(templatePath, 'id_rsa-gorilla.pub'), keys.public, {mode: 600});
        fs.writeFileSync(path.join(templatePath, 'id_rsa-gorilla'), keys.private, {mode: 600});

        events.publish('PROMISEME');

    }, 

    open: function(url, message){

        events.publish('MESSAGE', [message + ' ' + url]);

        openUrl(url + '/gorilla-maintenance', function(err){

            events.publish('VERBOSE', [err]);
            if (err) events.publish('WARNING', ['007']);

            events.publish('PROMISEME');

        });

    },

    check: function(url){

        var status;

        events.publish('PROMISEME');

        request(url, function (error, response, body) {

            if(response){

                status = response.statusCode;

            }

            if(status === 200){

                events.publish('PROMISEME');

            }else{

                setTimeout(function(){

                    if(attempts < 1){

                        attempts += 1;
                        module.exports.check(url);

                    }else{

                        events.publish('PROMISEME');

                    }

                }, 2000);
            }

        });

    },

    add: function(hostsFile, domain, ip){
        
        var replace;

        if(checkIp.isV4Format(ip) || checkIp.isV6Format(ip)){

            replace = ip + ' ' + domain + ' #GorillaJS \n' + ip + ' www.' + domain + ' #GorillaJS';

            if(!tools.lineExists(hostsFile, replace)){

                if(process.platform === 'win32'){

                    cross.exec('ECHO ' + replace + ' >> ' + hostsFile, function(err, stdout, stderr){

                        events.publish('VERBOSE', [stderr]);
                        events.publish('PROMISEME');

                    });

                }else{

                    cross.exec('sudo -- sh -c "echo \'' + replace + '\' >> ' + hostsFile + '"', function(err, stdout, stderr){

                        events.publish('VERBOSE', [stderr]);
                        events.publish('PROMISEME');

                    });

                }

            }else{

                events.publish('PROMISEME');

            }

        }else{

            events.publish('WARNING', ['010']);

        }

    },

    create: function(platform, template, to, domain){

        if(platform === 'nginx'){

            cross.moveFiles(to, true, '', template);

            cross.exec('sudo mv ' + to + ' /etc/nginx/sites-available/' + domain, function(err, stdout, stderr){

                if (err) events.publish('ERROR', ['017']);
                events.publish('VERBOSE', [stderr]);

                cross.exec('sudo ln -s /etc/nginx/sites-available/' + domain + ' /etc/nginx/sites-enabled', function(err, stdout, stderr){

                    if (err) events.publish('ERROR', ['017']);
                    events.publish('VERBOSE', [stderr]);

                    cross.exec('sudo service nginx restart', function(err, stdout, stderr){

                        if (err) events.publish('ERROR', ['017']);
                        events.publish('VERBOSE', [stderr]);

                        events.publish('PROMISEME');

                    }, true);

                }, true);

            }, true);

        }else if(platform === 'apache'){

        }

    }
}
