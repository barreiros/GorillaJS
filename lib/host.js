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
        
        var exist, replace;

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
                    fs.appendFile(args[0], replace, function(err){
                        if (err){
                            console.log('');
                            console.log('**************************************************************'.bold.red);
                            console.log('');
                            console.log(' If you want access to your machine through project name, add this line to your hosts file: '.bold.red);
                            console.log('');
                            console.log(' ' + replace.bold.green);
                            console.log('');
                            console.log('**************************************************************'.bold.red);
                            console.log('');
                        }
                    });
                }
            });
        }else{
            console.log('La Ip ' + args[2] + ' no es válida');
        }

        events.publish('PROMISEME');
    }
}
