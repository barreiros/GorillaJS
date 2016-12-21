var path = require('path');
var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var chokidar = require('chokidar');
var Tail = require('tail').Tail;
var logsPath = '/root/logs';
var watcher;
var client;
var currentProject;

app.get('/', function(req, res){

    res.sendFile(__dirname + '/src/index.html');

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

                    console.log('Hola, Bar', data);
                    client.emit('new_line', data);

                }

            });

            tail = new Tail(logsPath + '/' + currentProject + '/' + container);

            tail.on('line', function(line){
                
                console.log(line);
                client.emit('new_line', line);
                
            });

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


// Creo un watcher para detectar los cambios en las carpeta. Siempre que haya alguno, envío un evento con toda la estructura para refrescar el select del front-end.

// Creo un listener para recibir el valor seleccionado por el usuario en el select.

// Creo un listener para recibir la tab del contenedor que haya seleccionado el usuario. Cuando el front-end recibe por primera vez un nuevo proyecto y crea las tabs, me envía este evento con la tab por devecto.

// Creo un watcher para detectar los cambios del archivo/proyecto que haya seleccionado el usuario desde el front-end. Antes de hacer esto tengo que comprobar si hay algún watcher en funcionamiento para eliminarlo, o si el actual es del mismo archivo.
