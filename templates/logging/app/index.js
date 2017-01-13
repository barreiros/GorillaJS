var path = require('path');
var fs = require('fs');
var express = require('express');
var basic = require('express-authentication-basic');
var app = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var chokidar = require('chokidar');
var Tail = require('always-tail2');
var logsPath = '/root/logs';
var watcher;
var client;
var currentProject;
var userCredentials = JSON.parse(fs.readFileSync(__dirname + '/.password'));

app.use(basic(function(challenge, callback) {

    if (challenge.username === 'logs' && challenge.password === userCredentials.password) {

        callback(null, true, { user: 'logs' });

    } else {

        callback(null, false, { error: 'INVALID_PASSWORD' });

    }

}));

app.get('/', function(req, res){

    if (req.authenticated) {
        res.sendFile(__dirname + '/src/index.html');
    } else {
        res.status(401).send();
    }

});
app.use("/static", express.static(__dirname + '/src/static'));

watcher = chokidar.watch([logsPath + '/**/*'], {
    persistent: true
});
watcher.on('addDir', function(new_path){

    if(path.dirname(new_path) === logsPath){

        if(client){

            client.emit('projects_list', getDirectories(logsPath));

        }

    }

});
watcher.on('unlinkDir', function(old_path){

    console.log('He eliminado el directorio', old_path);

    if(path.dirname(old_path) === logsPath){

        if(client){

            client.emit('projects_list', getDirectories(logsPath));

        }

    }

});

io.on('connection', function(new_client) {  

    var tail;

    client = new_client;
    client.emit('projects_list', getDirectories(logsPath));
    client.on('change_project', function(project){

        currentProject = project;
        client.emit('new_project', getFiles(logsPath + '/' + project));

    });
    client.on('change_container', function(container){

        if(tail){

            tail.unwatch();
            delete tail;

        }

        console.log('New tail', logsPath + '/' + currentProject + '/' + container);

        if(currentProject && container){


            fs.readFile(logsPath + '/' + currentProject + '/' + container, 'utf8', function(err, data) {

                if (!err) {

                    client.emit('new_line', data);

                }

            });

            tail = new Tail(logsPath + '/' + currentProject + '/' + container, '\n');

            tail.on('line', function(line){
                
                console.log(line);
                client.emit('new_line', line);
                
            });

            tail.watch();

        }

    });
    client.on('disconnect', function(){

        if(tail){

            tail.unwatch();
            delete tail;

        }

    });

});

server.listen(80); 

function getFiles(srcpath){

    return fs.readdirSync(srcpath).filter(function(file) {

        return ! fs.statSync(path.join(srcpath, file)).isDirectory();

    });

}

function getDirectories(srcpath) {

    return fs.readdirSync(srcpath).filter(function(file) {

        return fs.statSync(path.join(srcpath, file)).isDirectory();

    });

}
