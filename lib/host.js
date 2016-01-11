var events = require(__dirname + '/pubsub.js');
var fs = require('fs');
var split = require('split');
var checkIp = require('ip');
var execSync = require('child_process').execSync;
var openUrl = require('open');
var sleep = require('sleep');
var cross = require(__dirname + '/crossExec.js');
var tools = require(__dirname + '/tools.js');

module.exports = {

    open: function(url, waitingfor, message){

        events.publish('MESSAGE', [message + ' : ' + url]);

        sleep.sleep(waitingfor);
        openUrl(url, function(err){
            if (err) events.publish('WARNING', ['007']);
            events.publish('VERBOSE', [err]);
        });

        events.publish('PROMISEME');
    },

    add: function(hostsfile, domain, ip){
        
        var replace;

        if(checkIp.isV4Format(ip) || checkIp.isV6Format(ip)){

            replace = ip + ' ' + domain + ' #GorillaJS';
            if(!tools.lineExists(hostsfile, replace)){
                tools.addLine(hostsfile, replace, true);
            }

            // exist = false;
            // fs.createReadStream(hostsfile)
            //     .pipe(split())
            //     .on('data', function(line){
            //         if(line.indexOf(domain) !== -1){
            //             exist = true;
            //         }
            //     })
            // .on('end', function(){
            //     if(!exist){
            //         events.publish('STEP', ['hosts-adddomain']);
            //
            //         stdout = execSync('sudo -- sh -c "echo \'' + replace + '\' >> ' + hostsfile + '"');
            //         events.publish('PROMISEME');
            //         events.publish('VERBOSE', [stdout]);
            //     }else{
            //         events.publish('PROMISEME');
            //     }
            // });
        }else{
            events.publish('WARNING', ['010']);
        }

        events.publish('PROMISEME');
    },

    create: function(platform, template, to, domain){
        events.publish('STEP', ['hosts-createproxy']);

        if(platform === 'nginx'){
            cross.moveFiles(template, to, true);
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
        console.log(platform, template, to, domain);
    }
}
