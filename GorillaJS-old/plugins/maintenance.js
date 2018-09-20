'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var commit = require(path.join(envPaths.libraries, 'commit.js'));

events.subscribe('INIT_PLUGINS', init);

function init(gorillaFile){

    if(argv._[0] === 'maintenance'){

    }

}

function flattenImage(image){

    // Reduzco el número de capas de las imágenes que tenga el proyecto.

}

function clearProject(){

    // Borro todos los datos relacionados con el proyecto: archivos, bases de datos, etc.

}
