'use strict';

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');
var yaml = require('yamljs');

var events = require(__dirname + '/../lib/pubsub.js');
var cross = require(__dirname + '/../lib/crossExec.js');
var tools = require(__dirname + '/../lib/tools.js');
var promises = require(__dirname + '/../lib/promises.js');

events.subscribe('INIT_PLUGINS', init);
events.subscribe('CONFIGURE_PROXY', configure);

function init(gorillafile){

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
