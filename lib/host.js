var events = require(__dirname + '/pubsub.js');
var fs = require('fs');
var split = require('split');
var checkIp = require('ip');
var execSync = require('child_process').execSync;
var openUrl = require('open');
var sleep = require('sleep');

module.exports = {

    open: function(args){

        events.publish('MESSAGE', [args[2] + ' : ' + args[0]]);

        sleep.sleep(args[1]);
        openUrl(args[0], function(err){
            if (err) events.publish('WARNING', ['007']);
            events.publish('VERBOSE', [err]);
        });

        events.publish('PROMISEME');
    },

    add: function(args){
        
        var exist, replace, stdout;

        if(checkIp.isV4Format(args[2]) || checkIp.isV6Format(args[2])){

            exist = false;
            replace = args[2] + ' ' + args[1] + ' #GorillaJS';
            fs.createReadStream(args[0])
                .pipe(split())
                .on('data', function(line){
                    if(line.indexOf(args[1]) !== -1){
                        exist = true;
                    }
                })
            .on('end', function(){
                if(!exist){
                    events.publish('STEP', ['hosts-adddomain']);

                    stdout = execSync('sudo -- sh -c "echo \'' + replace + '\' >> ' + args[0] + '"');
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
