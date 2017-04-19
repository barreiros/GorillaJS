/**
 * Plugin name: Adminer
 * 
 */

'use strict';

var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

events.subscribe('INIT_PLUGINS', init);
events.subscribe('DOCKER_STARTED', addAdminer);

function init(gorillaFile){

}

function addAdminer(){


    // Copio los contenidos en el contenedor: script bash y carpeta pública.
    cross.exec('docker cp ' + envPaths.plugins + '/adminer/public gorillajsproxy:/var/www/adminer && docker cp ' + envPaths.plugins + '/adminer/adminer.sh gorillajsproxy:/etc/adminer.sh', function(err, stdout, stderr){

        // Ejecuto el script de bash.

    });


}

