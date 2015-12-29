var events = require(__dirname + '/pubsub.js');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var gulp = require('gulp');
var fs = require('fs');
var https = require('https');

module.exports = {

    initRepo: function(args){
        events.publish('STEP', ['git-init']);

        var url;

        if(args[0] === 'github'){
            url = 'https://github.com/' + args[1] + '/' + args[2] + '.git';
        }else if(args[0] === 'bitbucket'){
            url = 'https://bitbucket.org/' + args[1] + '/' + args[2] + '.git';
        }else if(args[0] === 'gitlab'){
            url = 'https://gitlab.com/' + args[1] + '/' + args[2] + '.git';
    }

        exec('git init', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['001']);
            events.publish('VERBOSE', [stderr]);

            var remote = execSync('git remote -v').toString();

            if(remote.length > 0){
                execSync('git remote rm origin');
            }
            exec('git remote add origin ' + url, function(err, stdout, stderr){
                if (err) events.publish('WARNING', ['001']);
                events.publish('VERBOSE', [stderr]);

                events.publish('PROMISEME');
            });
        });
    },

    createBranch: function(args){

        events.publish('STEP', ['git-branch-' + args]);

        exec('git checkout --orphan ' + args, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['002']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    createRemote: function(args){
        events.publish('STEP', ['git-remote']);

        var response;

        if(args[0] === 'github'){

            exec('curl -u ' + args[1] +':' + args[2] + ' https://api.github.com/user/repos -d \'{"name": "' + args[4]+ '", "private": ' + args[3]+ '}\'', function(err, stdout, stderr){

                response = JSON.parse(stdout);

                if(!response.hasOwnProperty('name')){
                    events.publish('ERROR', ['005']);
                }
                events.publish('VERBOSE', [response]);
                events.publish('PROMISEME');
            });
        }else if(args[0] === 'bitbucket'){

            exec('curl --user ' + args[1] +':' + args[2] + ' https://api.bitbucket.org/1.0/repositories/ --data name=' + args[4] + ' --data is_private=' + args[3], function(err, stdout, stderr){

                try{
                    response = JSON.parse(stdout);

                    if(!response.hasOwnProperty('name')){
                        events.publish('ERROR', ['005']);
                    }
                    events.publish('VERBOSE', [response]);
                }catch(err){
                    events.publish('ERROR', ['005']);
                }

                events.publish('PROMISEME');
            });
        }else if(args[0] === 'gitlab'){

            exec('curl --header "PRIVATE-TOKEN: ' + args[2] + '" -X POST "https://gitlab.com/api/v3/projects?name=' + args[4] + '&public=' + !args[3] + '"', function(err, stdout, stderr){

                try{
                    response = JSON.parse(stdout);

                    if(!response.hasOwnProperty('name')){
                        events.publish('ERROR', ['005']);
                    }
                }catch(err){
                    events.publish('ERROR', ['005']);
                }

                events.publish('VERBOSE', [response]);
                events.publish('PROMISEME');
            });
        }
    },

    checkout: function(args){

        exec('git checkout ' + args, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['003']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    reset: function(){
    
        exec("git reset --hard", function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    add: function(args){

        exec("git add " + args + "", function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['005']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    commit: function(args){

        exec("git commit -m '" + args + "'", function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['006']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    push: function(args){
        events.publish('STEP', ['git-push']);

        exec("git push origin " + args, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['002']);
            events.publish('VERBOSE', [stderr, true]);

            events.publish('PROMISEME');
        });
    },

    clone: function(args){
        events.publish('STEP', ['git-clone']);

        exec('git clone ' + args[0] + ' --branch ' + args[1] + ' --single-branch ' + args[2], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    }
}
