var events = require(__dirname + '/pubsub.js');
var fs = require('fs');
var split = require('split');
var checkIp = require('ip');
var openUrl = require('open');
var cross = require(__dirname + '/crossExec.js');
var tools = require(__dirname + '/tools.js');

module.exports = {

    open: function(url, waitingfor, message){

        events.publish('MESSAGE', [message + ' : ' + url]);

        setTimeout(function(){

            openUrl(url, function(err){
                if (err) events.publish('WARNING', ['007']);
                events.publish('VERBOSE', [err]);
            });

        }, waitingfor);

        events.publish('PROMISEME');
    },

    add: function(hostsFile, domain, ip){
        
        var replace;

        if(checkIp.isV4Format(ip) || checkIp.isV6Format(ip)){

            replace = ip + ' ' + domain + ' #GorillaJS';

            if(!tools.lineExists(hostsFile, replace)){

                if(process.platform === 'windows'){

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

        events.publish('STEP', ['hosts-createproxy']);

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
