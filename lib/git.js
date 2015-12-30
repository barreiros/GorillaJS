var events = require(__dirname + '/pubsub.js');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var gulp = require('gulp');
var fs = require('fs');
var https = require('https');

module.exports = {

    initRepo: function(platform, username, projectPath){
        events.publish('STEP', ['git-init']);

        console.log(username);
        var url;

        if(platform === 'github'){
            url = 'https://github.com/' + username + '/' + projectPath + '.git';
        }else if(platform === 'bitbucket'){
            url = 'https://bitbucket.org/' + username + '/' + projectPath + '.git';
        }else if(platform === 'gitlab'){
            url = 'https://gitlab.com/' + username + '/' + projectPath + '.git';
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

    createBranch: function(name){

        events.publish('STEP', ['git-branch-' + name]);

        exec('git checkout --orphan ' + name, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['002']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    createRemote: function(platform, username, password, private, slug){
        events.publish('STEP', ['git-remote']);

        var response;

        if(platform === 'github'){

            exec('curl -u ' + username +':' + password + ' https://api.github.com/user/repos -d \'{"name": "' + slug + '", "private": ' + private + '}\'', function(err, stdout, stderr){

                response = JSON.parse(stdout);

                if(!response.hasOwnProperty('name')){
                    events.publish('ERROR', ['005']);
                }
                events.publish('VERBOSE', [response]);
                events.publish('PROMISEME');
            });
        }else if(platform === 'bitbucket'){

            exec('curl --user ' + username +':' + password + ' https://api.bitbucket.org/1.0/repositories/ --data name=' + slug + ' --data is_private=' + private, function(err, stdout, stderr){

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
        }else if(platform === 'gitlab'){

            exec('curl --header "PRIVATE-TOKEN: ' + password + '" -X POST "https://gitlab.com/api/v3/projects?name=' + slug + '&public=' + !private + '"', function(err, stdout, stderr){

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

    checkout: function(branch){

        exec('git checkout ' + branch, function(err, stdout, stderr){
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

    add: function(path){

        exec("git add " + path + "", function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['005']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    commit: function(message){

        exec("git commit -m '" + message + "'", function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['006']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    push: function(branch){
        events.publish('STEP', ['git-push']);

        exec("git push origin " + branch, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['002']);
            events.publish('VERBOSE', [stderr, true]);

            events.publish('PROMISEME');
        });
    },

    clone: function(from, branch, tempPath){
        events.publish('STEP', ['git-clone']);

        exec('git clone ' + from + ' --branch ' + branch + ' --single-branch ' + tempPath, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    }
}
