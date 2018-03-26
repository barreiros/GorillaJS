import { PROJECT_PLUGINS_OFFICIAL, PROJECT_PLUGINS_CUSTOM } from '../const.js'
import { pathExistsSync, ensureFileSync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import JSPath from 'jspath'
import glob from 'glob'
import path from 'path'

class Plugins {

    constructor(){

        // Incluyo todos los plugins.
        let files = '{' + PROJECT_PLUGINS_OFFICIAL + ',' + PROJECT_PLUGINS_CUSTOM + '}/**/config.json'

        // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
        for(let file of glob.sync(files)){

            let json = JSON.parse(readFileSync(file, 'utf8'))

            if(json.plugin){

                let main = path.join(path.dirname(file), json.plugin.main)

                require(main);

            }

        }

    }

    add(source){

    }

    remove(name){

    }

    get list(){

    }

    installDependencies(pluginPath){

        let packagePath;

        // // Si es un directorio...
        // if(fs.lstatSync(pluginPath).isDirectory()){
        //
        //     packagePath = path.join(pluginPath, 'package.json');
        //
        //     // Si existe un archivo package.json, lo ejecuto para instalar las dependencias.
        //     if(fs.existsSync(packagePath)){
        //
        //         cross.exec('npm install --prefix ' + pluginPath, function(err, stdout, stderr){
        //
        //             events.publish('VERBOSE', [err, stderr, stdout]);
        //
        //             events.publish('PROMISEME');
        //
        //         });
        //
        //     }
        //
        // }
    
    }

}

export default Plugins
