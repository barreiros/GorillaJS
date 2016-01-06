var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');
var fs = require('fs');
var https = require('https');
var cross = require(__dirname + '/crossExec.js');

var projectPath;

module.exports = {

    config: function(path){
        projectPath = path;

        events.publish('PROMISEME');
    },

    initRepo: function(){
        events.publish('STEP', ['git-init']);

        cross.exec('git -C ' + projectPath + ' init', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['001']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    addOrigin: function(platform, username, slug){

        var url;

        if(platform === 'github'){
            url = 'https://github.com/' + username + '/' + slug + '.git';
        }else if(platform === 'bitbucket'){
            url = 'https://bitbucket.org/' + username + '/' + slug + '.git';
        }else if(platform === 'gitlab'){
            url = 'https://gitlab.com/' + username + '/' + slug + '.git';
        }

        cross.execSync('git', ['-C', projectPath, 'remote', '-v'], function(err, stdout, stderr){
            events.publish('VERBOSE', [stderr]);

            if(stdout.toString().length > 0){
                cross.execSync('git', ['-C', projectPath, 'remote', 'rm', 'origin'], function(err, stdout, stderr){
                    events.publish('VERBOSE', [stderr]);
                });
            }
        });

        cross.exec('git -C ' + projectPath + ' remote add origin ' + url, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['001']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    createBranch: function(name){

        events.publish('STEP', ['git-branch-' + name]);

        cross.exec('git -C ' + projectPath + ' checkout --orphan ' + name, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['002']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    createRemote: function(platform, username, password, private, slug){
        events.publish('STEP', ['git-remote']);

        var response;

        if(platform === 'github'){

            cross.exec('curl -u ' + username +':' + password + ' https://api.github.com/user/repos -d \'{"name": "' + slug + '", "private": ' + private + '}\'', function(err, stdout, stderr){
                events.publish('VERBOSE', [stdout.toString()]);

                try{
                    response = JSON.parse(stdout);
                    if(!response.hasOwnProperty('name')){
                        events.publish('ERROR', ['005']);
                    }else{
                        events.publish('PROMISEME');
                    }
                }catch(err){
                    events.publish('ERROR', ['005']);
                    events.publish('VERBOSE', [err]);
                }
            });
        }else if(platform === 'bitbucket'){

            cross.exec('curl --user ' + username +':' + password + ' https://api.bitbucket.org/1.0/repositories/ --data name=' + slug + ' --data is_private=' + private, function(err, stdout, stderr){
                events.publish('VERBOSE', [stdout.toString()]);

                try{
                    response = JSON.parse(stdout);
                    if(!response.hasOwnProperty('name')){
                        events.publish('ERROR', ['005']);
                    }else{
                        events.publish('PROMISEME');
                    }
                }catch(err){
                    events.publish('ERROR', ['005']);
                    events.publish('VERBOSE', [err]);
                }
            });
        }else if(platform === 'gitlab'){

            cross.exec('curl --header "PRIVATE-TOKEN: ' + password + '" -X POST "https://gitlab.com/api/v3/projects?name=' + slug + '&public=' + !private + '"', function(err, stdout, stderr){
                events.publish('VERBOSE', [stdout.toString()]);

                try{
                    response = JSON.parse(stdout);
                    if(!response.hasOwnProperty('name')){
                        events.publish('ERROR', ['005']);
                    }else{
                        events.publish('PROMISEME');
                    }
                }catch(err){
                    events.publish('ERROR', ['005']);
                    events.publish('VERBOSE', [err]);
                }
            });
        }
    },

    checkout: function(branch){

        cross.exec('git -C ' + projectPath + ' checkout ' + branch, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['003']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    reset: function(){
    
        cross.exec('git -C ' + projectPath + ' reset --hard', function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    add: function(path){

        cross.exec('git -C ' + projectPath + ' add ' + path, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['005']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    commit: function(message){

        cross.exec('git -C ' + projectPath + ' commit -m "' + message + '"', function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['006']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    push: function(branch){
        events.publish('STEP', ['git-push']);

        cross.exec('git -C ' + projectPath + ' push origin ' + branch, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['002']);
            events.publish('VERBOSE', [stderr, true]);

            events.publish('PROMISEME');
        });
    },

    clone: function(from, branch, tempPath){
        events.publish('STEP', ['git-clone']);

        cross.exec('git -C ' + projectPath + ' clone ' + from + ' --branch ' + branch + ' --single-branch ' + tempPath, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    }
}
