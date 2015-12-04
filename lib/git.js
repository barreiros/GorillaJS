var git = require('gulp-git');
var bitbucket = require('bitbucket-rest');
var events = require(__dirname + '/pubsub.js');
var gulp = require('gulp');

module.exports = {

    createRemote: function(){

        var client;

        client = bitbucket.connectClient({username: tools.param('git', 'username'), password: tools.param('git', 'password')});
        client.createRepo({
            owner: tools.param('git', 'username'),
            repo_slug: tools.param('project', 'slug'),
            is_private: true
        }, function(bit){
            console.log(bit);

            events.publish('PROMISEME');
        });
    },
    initRepo: function(){

        git.init({}, function(err){
            if (err) console.log(err);

            git.addRemote('origin', tools.param('git', 'mainrepo'), function (err) {
                if (err) console.log(err);

                events.publish('PROMISEME');
            });
        });
    },
    createBranch: function(args){

        git.checkout(args, {args: '--orphan'}, function (err) {
            if (err) {
                // console.log(err);

                git.branch(args, function(err){
                    // if (err) console.log(err);

                    events.publish('PROMISEME');
                });
            }else{
                events.publish('PROMISEME');
            }
        });
    },
    checkout: function(args){

        git.checkout(args, function (err) {
            // if (err) console.log(err)

            events.publish('PROMISEME');
        });
    },
    reset: function(){
    
        exec("git reset --hard", function(err, stdout, stderr){
            console.log(stdout);  
            console.log(stderr);

            events.publish('PROMISEME');
        });
    },
    add: function(args){

        exec("git add " + args + "", function(err, stdout, stderr){
            console.log(stdout);  
            console.log(stderr);

            events.publish('PROMISEME');
        });
    },
    commit: function(args){

        exec("git commit -m '" + args + "'", function(err, stdout, stderr){
            console.log(stdout);  
            console.log(stderr);

            events.publish('PROMISEME');
        });
    },
    push: function(args){

        git.push('origin', args, function (err) {
            if (err) throw err;

            events.publish('PROMISEME');
        });
    },
    clone: function(args){

        exec("git clone " + args[0] + " --branch devel --single-branch ./temp_repo", function(err, stdout, stderr){
            console.log(stdout);  
            console.log(stderr);

            events.publish('PROMISEME');
        });
    }
}
