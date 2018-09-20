'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var events = require(path.join(envPaths.libraries, 'pubsub.js'));
var cross = require(path.join(envPaths.libraries, 'crossExec.js'));
var tools = require(path.join(envPaths.libraries, 'tools.js'));
var promises = require(path.join(envPaths.libraries, 'promises.js'));

events.subscribe('INIT_PLUGINS', init);
events.subscribe('CONFIGURE_PROXY', configure);

function init(gorillaFile){

    var argTail, data;

    if(fs.existsSync(gorillaFile)){

        data = JSON.parse(fs.readFileSync(gorillaFile));

    }

}

function configure(gorillaFile, applicationPath, templateApplication, templateProxy, systemPath){

    var settings, promisesPack;

    settings = JSON.parse(fs.readFileSync(gorillaFile));

    promisesPack = [

        [configureVarnish, [settings.local, applicationPath, templateApplication, templateProxy, systemPath]], 
        [tools.setEnvVariables]

    ];
    promises.sandwich(promisesPack);

}

function configureVarnish(settings, applicationPath, templateApplication, templateProxy, systemPath){

    var file, destiny, data;

    destiny = path.join(systemPath, 'varnish') + '/' + settings.project.domain + '.vcl';
    fsx.ensureDirSync(templateProxy);

    if(fs.existsSync(applicationPath + '/varnish')){

        file = applicationPath + '/varnish';
        fsx.copySync(file, destiny);

    }else{

        if(fs.existsSync(path.join(templateApplication, 'varnish'))){

            file = templateApplication + '/varnish';

        }else{

            file = templateProxy + '/varnish';

        }

        fsx.copySync(file, applicationPath + '/varnish');
        fsx.copySync(file, destiny);

    }

    events.publish('PROMISEME', destiny);

}
