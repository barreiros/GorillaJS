'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var through = require('through2');
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var variables = require(path.join(envPaths.libraries, 'variables.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));
var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

module.exports = {

    login: login,
    logout: logout

}

function login(name, password){

    var credentials, promisesPack;

    if(name && password){

        // Si recibo nombre y contraseña obvio al usuario que pudiera tener guardado.
        promisesPack = [

            [requestToken, [name, password], 'token']

        ];

    }else{

        // Recupero las credenciales del archivo común.
        credentials = JSON.parse(fs.readFileSync(path.join(variables.homeUserPathNodeJS, variables.proxyName, 'config.json')));

        if(credentials.hasOwnProperty('name') && credentials.hasOwnProperty('password')){// Si existen credenciales hago la llamda al servidor directamente.

            promisesPack = [

                [requestToken, [credentials.name, credentials.password], 'token']

            ];

        }else{// Si no existe el archivo, o está vacío, muestro el mensaje de login.

            promisesPack = [

                [tools.param, ['login', 'name', null, null, false], 'name'],
                [tools.param, ['login', 'password', null, null, false], 'password'],
                [requestToken, ['{{name}}', '{{password}}'], 'token']

            ];

        }

    }


    promises.sandwich(promisesPack);

    events.publish('PROMISEME');

}

function requestToken(name, password){

    var request, options, config, promisesPack;

    request = require('request');
    options = {
        
        url: variables.pluginsWebService + '/credentials/v1/login', 
        method: 'POST',
        headers: {

            'Content-type': 'application/json'

        },
        body: JSON.stringify({

            username: name,
            password: password

        })

    }

    // Conecto con el servidor.
    request.post(options, function(error, response, body){

        if(!error){

            body = JSON.parse(body);

            if(body.hasOwnProperty('token')){ // Si es correcto guardo las credenciales y devuelvo un token para esta operación.

                config = JSON.parse(fs.readFileSync(path.join(variables.homeUserPathNodeJS, variables.proxyName, 'config.json')));
                config['name'] = name;
                config['password'] = password;
                fs.writeFileSync(path.join(variables.homeUserPathNodeJS, variables.proxyName, 'config.json'), JSON.stringify(config, null, '\t'));

                events.publish('PROMISEME', body.token);

            }else{ // Si no es correcto devuelvo el error y le vuelvo a mostrar al usuario el mensaje de login.

                promisesPack = [

                    [tools.param, ['login', 'name', null, null, false], 'name'],
                    [tools.param, ['login', 'password', null, null, false], 'password'],
                    [requestToken, ['{{name}}', '{{password}}'], 'token']

                ];

                promises.sandwich(promisesPack);

                events.publish('WARNING', ['Incorrect user or password.']);
                events.publish('PROMISEME');

            }

        }else{

            events.publish('ERROR', ['042']);

        }

    });

}

function logout(){

    var config;

    config = JSON.parse(fs.readFileSync(path.join(variables.homeUserPathNodeJS, variables.proxyName, 'config.json')));

    delete config.name;
    delete config.password;

    fs.writeFileSync(path.join(variables.homeUserPathNodeJS, variables.proxyName, 'config.json'), JSON.stringify(config, null, '\t'));

}


