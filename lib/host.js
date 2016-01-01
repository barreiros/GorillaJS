var events = require(__dirname + '/pubsub.js');
var fs = require('fs');
var split = require('split');
var checkIp = require('ip');
var execSync = require('child_process').execSync;
var openUrl = require('open');
var sleep = require('sleep');

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
        
        var exist, replace, stdout;

        if(checkIp.isV4Format(ip) || checkIp.isV6Format(ip)){

            exist = false;
            replace = ip + ' ' + domain + ' #GorillaJS';
            fs.createReadStream(hostsfile)
                .pipe(split())
                .on('data', function(line){
                    if(line.indexOf(domain) !== -1){
                        exist = true;
                    }
                })
            .on('end', function(){
                if(!exist){
                    events.publish('STEP', ['hosts-adddomain']);

                    stdout = execSync('sudo -- sh -c "echo \'' + replace + '\' >> ' + hostsfile + '"');
                    events.publish('PROMISEME');
                    events.publish('VERBOSE', [stdout]);
                }else{
                    events.publish('PROMISEME');
                }
            });
        }else{
            events.publish('WARNING', ['010']);
        }
    }
}
