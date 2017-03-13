var events = require(__dirname + '/pubsub.js');
var cross = require(__dirname + '/crossExec.js');
var fsx = require('fs-extra');
var tools = require(__dirname + '/tools.js');

var projectPath;

module.exports = {

    config: function(path){
        projectPath = path;

        events.publish('PROMISEME');
    },

    initRepo: function(gorillaFolder){

        cross.exec('git -C ' + projectPath + ' init', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['001']);
            events.publish('VERBOSE', [stderr]);

            fsx.ensureFileSync(projectPath + '/.gitignore');
            if(!tools.lineExists(projectPath + '/.gitignore', gorillaFolder)){
                tools.addLine(projectPath + '/.gitignore', gorillaFolder);
            }
            if(!tools.lineExists(projectPath + '/.gitignore', '.gitignore')){
                tools.addLine(projectPath + '/.gitignore', '.gitignore');
            }
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

        cross.spawnSync('git', ['-C', projectPath, 'remote', '-v'], function(err, stdout, stderr){
            events.publish('VERBOSE', [stderr]);

            if(stdout.toString().length > 0){
                cross.spawnSync('git', ['-C', projectPath, 'remote', 'rm', 'origin'], function(err, stdout, stderr){
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

    createBranch: function(name, clean){


        var command, exists; 

        exists = cross.spawnSync('git', ['-C', projectPath, 'rev-parse', '--verify', name]);
        if(exists.toString()){
            command = 'git -C ' + projectPath + ' checkout ' + name;
        }else{
            if(clean){
                command = 'git -C ' + projectPath + ' checkout --orphan ' + name;
                command += ' && git -C ' + projectPath + ' reset --hard';
                command += ' && git -C ' + projectPath + ' clean -d -f';
            }else{
                command = 'git -C ' + projectPath + ' checkout --orphan ' + name;
            }
            command += ' && git commit --allow-empty -m "GorillaJS Initial point"';
        }

        cross.exec(command, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['002']);
            events.publish('VERBOSE', [stderr]);

            setTimeout(function(){
                events.publish('PROMISEME');
            }, 2000);
        });
    },

    createRemote: function(platform, username, password, private, slug){

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

    add: function(path, force){

        cross.exec('git -C ' + projectPath + ' add ' + path + ' -A', function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['005']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    commit: function(message, empty){

        var allow = '--allow-empty';

        var comman;

        if(empty){
            command = 'git -C ' + projectPath + ' commit --allow-empty -m "' + message + '"';
        }else{
            command = 'git -C ' + projectPath + ' commit -m "' + message + '"';
        }
        cross.exec(command, function(err, stdout, stderr){
            if (err) events.publish('WARNING', ['006']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    push: function(branch){

        cross.exec('git -C ' + projectPath + ' push origin ' + branch, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['002']);
            events.publish('VERBOSE', [stderr, true]);

            events.publish('PROMISEME');
        });
    },

    clone: function(from, branch, tempPath){

        cross.exec('rm -rf ' + tempPath + ' && git -C ' + projectPath + ' clone ' + from + ' --branch ' + branch + ' --single-branch ' + tempPath, function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['004']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    reset: function(branch, id){

        if(id === 'last'){
            events.publish('ERROR', ['025']);
        }else{
            if(id.search('::') !== -1){
                id = id.substring(0, id.search('::')).replace(' ', '');  
            }

            cross.spawnSync('git', ['reset', '--hard', id], function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['024']);
                events.publish('VERBOSE', [stderr]);

                cross.spawnSync('git', ['-C', projectPath, 'clean', '-d', '-f']);
                events.publish('PROMISEME');
            });
        }
    },

    stash: function(param){

        var command;

        if(param){
            command = 'git -C ' + projectPath + ' stash ' + param;
        }else{
            command = 'git -C ' + projectPath + ' stash';
        }

        cross.exec(command, function(err, stdout, stderr){
            if (err && stderr.indexOf('No stash found') === -1) events.publish('WARNING', ['013']);
            events.publish('VERBOSE', [stderr]);

            events.publish('PROMISEME');
        });
    },

    currentBranch: function(){

        cross.exec('git -C ' + projectPath + ' rev-parse --abbrev-ref HEAD', function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['026']);
            events.publish('VERBOSE', [stderr]);

            stdout = stdout.toString().split('\n')
            events.publish('PROMISEME', stdout[0]);
        });
    },

    creationBranchDate: function(branch){

    },

    commitDate: function(branch, id){

        var dates;

        if(id){

            if(id.search('::') !== -1){
                id = id.substring(0, id.search('::')).replace(' ', '');  
            }

            cross.spawnSync('git', ['show', id, branch, '-s', '--oneline', '--pretty=format:%ci'], function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['020']);

                date = stdout.toString();
            });
        }else{

            cross.spawnSync('git', ['show', branch, '-s', '--oneline', '--pretty=format:%ci'], function(err, stdout, stderr){
                if (err) events.publish('ERROR', ['020']);

                date = stdout.toString();
                if(date.length === 0){
                    date = new Date();
                }
            });
        }

        return date;
    }, 

    listCommits: function(branch, text){

        var commits;

        cross.spawnSync('git', ['log', branch, '--oneline', '--pretty=format:%H :: %s', '--grep=' + text], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['023']);
            events.publish('VERBOSE', [stderr]);

            commits = stdout.toString().split('\n');
            commits = commits.filter(function(value){
                if(value.length !== ''){
                    return value;
                }
            });
        });

        if(commits.lengt > 35){
            return commits.slice(1).slice(-35);
        }else{
            return commits;
        }
    },

    listFiles: function(since, until, branch, backward){
        events.publish('VERBOSE', ['since ' + since + ' until ' + until + ' on branch ' + branch]);

        var output, files, added;

        output = {};

        cross.spawnSync('git', ['log', branch, '--name-only', '--oneline', '--no-commit-id', '--pretty=format:""', '--diff-filter=AC', '--since', '"' + since + '"', '--until', '"' + until + '"'], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['020']);
            events.publish('VERBOSE', [stderr]);

            added = [];
            files = stdout.toString().split('\n');
            files = files.filter(function(value){
                if(value.length !== '' && added.indexOf(value) === -1){
                    added.push(value);
                    return value;
                }
            });
        });
        output.added = files;

        cross.spawnSync('git', ['log', branch, '--name-only', '--oneline', '--no-commit-id', '--pretty=format:', '--diff-filter=MT', '--since', '"' + since + '"', '--until', '"' + until + '"'], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['020']);
            events.publish('VERBOSE', [stderr]);

            files = stdout.toString().split('\n');
            files = files.filter(function(value){
                if(value.length !== ''){
                    return value;
                }
            });
        });
        output.modified = files;

        cross.spawnSync('git', ['log', branch, '--name-only', '--oneline', '--no-commit-id', '--pretty=format:', '--diff-filter=D', '--since', '"' + since + '"', '--until', '"' + until + '"'], function(err, stdout, stderr){
            if (err) events.publish('ERROR', ['020']);
            events.publish('VERBOSE', [stderr]);

            var dateAdded, dateDeleted, valueIn;

            files = stdout.toString().split('\n');
            files = files.filter(function(value){
                if(value.length !== ''){
                    dateAdded = cross.spawnSync('git', ['log', branch, '--oneline', '--pretty=format:%ct', '--since', '"' + since + '"', '--until', '"' + until + '"', '--diff-filter=ACM', '--', value]);
                    dateDeleted = cross.spawnSync('git', ['log', branch, '--oneline', '--pretty=format:%ct', '--since', '"' + since + '"', '--until', '"' + until + '"', '--diff-filter=D', '--', value]);
                    dateAdded = dateAdded.toString().split('\n');
                    dateDeleted = dateDeleted.toString().split('\n');

                    if(backward){
                        if(value){
                            if(dateAdded[dateAdded.length - 1] === '' || dateDeleted[dateDeleted.length - 1] < dateAdded[dateAdded.length - 1]){
                                tools.removeValueInArray(value, output.added);
                                tools.removeValueInArray(value, output.modified);
                                return value;
                            }
                        }
                    }else{
                        if(dateDeleted[0] > dateAdded[0]){
                            tools.removeValueInArray(value, output.added);
                            tools.removeValueInArray(value, output.modified);
                            return value;
                        }
                    }
                }
            });
        });
        output.deleted = files;


        events.publish('VERBOSE', [JSON.stringify(output)]);
        return output;
    }
}
