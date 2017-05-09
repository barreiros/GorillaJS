'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var through = require('through2');
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var inquirer = require('inquirer');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));

module.exports = {

    login: login,
    logout: logout

}

function login(credentialsFile){

    var credentials;

    fsx.ensureFileSync(credentialsFile);

    // Recupero las credenciales del archivo común.
    credentials = JSON.parse(fs.readFileSync(gorillaFile));

    if(credentials.hasOwnProperty('name') && credentials.hasOwnProperty('password')){// Si existen credenciales hago la llamda al servidor directamente.

        sendCredentials(credentials.name, credentials.passsword);

    }else{// Si no existe el archivo, o está vacío, muestro el mensaje de login.

        showLoginToUser();

    }

}

function sendCredentials(name, password){

    var request, options;

    request = require('request');
    options = {
        
        url: 'http://gorillajs.landing/wp-json/credentials/v1/login',
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

        console.log(error, response, body);
        // Si es correcto devuelvo un token para esta operación.
        // Si no es correcto devuelvo el error, borro las credenciales, si las tenía guardadas, y le vuelvo a mostrar al usuario el mensaje de login.

    }

}

function showLoginToUser(){

    inquirer.prompt([{

        type: 'input',
        name: 'option',
        message = ('GorillaJS account name').green;

    }], function(name){

        inquirer.prompt([{

            type: 'password',
            name: 'option',
            message = ('GorillaJS account password').green;

        }], function(password){

            sendCredentials(name, password);

        });

    });

}

function logout(){

}


