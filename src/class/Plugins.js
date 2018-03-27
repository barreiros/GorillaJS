import { PROJECT_PLUGINS_OFFICIAL, PROJECT_PLUGINS_CUSTOM } from '../const.js'
import { pathExistsSync, ensureFileSync, copySync, removeSync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import JSPath from 'jspath'
import glob from 'glob'
import path from 'path'

class Plugins {

    constructor(){

        // Recupero todos los plugins.
        let files = '{' + PROJECT_PLUGINS_OFFICIAL + ',' + PROJECT_PLUGINS_CUSTOM + '}/*/config.json'

        this.checkForDependencies(files)

        this.include(files)

    }


    add(source){

        source = path.resolve(source)

        if(pathExistsSync(source)){

            copySync(source, path.join(PROJECT_PLUGINS_CUSTOM, path.basename(source)));

            execSync('npm install -s', {
                'cwd': path.join(PROJECT_PLUGINS_CUSTOM, path.basename(source))
            })

        }else{

            // Error carpeta no existe.

        }

    }

    remove(name){

        let files = PROJECT_PLUGINS_CUSTOM + '/*/config.json'

        for(let file of glob.sync(files)){

            let json = JSON.parse(readFileSync(file, 'utf8'))

            // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
            if(json.plugin){

                if(json.plugin.name === name){

                    // Elimino el plugin
                    removeSync(path.dirname(file))

                    break

                }

            }

       }

    }

    reinstall(){

        let files = '{' + PROJECT_PLUGINS_OFFICIAL + ',' + PROJECT_PLUGINS_CUSTOM + '}/*/config.json'

        for(let file of glob.sync(files)){

            // Instalo las dependencias.
            if(pathExistsSync(path.join(path.dirname(file), 'package.json'))){

                execSync('npm install', {
                    'cwd': path.dirname(file)
                })

            }

       }

    }

    checkForDependencies(files){

        for(let file of glob.sync(files)){

            // Instalo las dependencias, si es necesario.
            if(!pathExistsSync(path.join(path.dirname(file), 'node_modules')) && pathExistsSync(path.join(path.dirname(file), 'package.json'))){

                execSync('npm install -s', {
                    'cwd': path.dirname(file)
                })

            }

       }

    }

    include(files){

        for(let file of glob.sync(files)){

            let json = JSON.parse(readFileSync(file, 'utf8'))

            // Busco el nodo "plugin" que es donde debe estar la configuración del plugin.
            if(json.plugin){

                let main = path.join(path.dirname(file), json.plugin.main)

                // Incluyo el archivo en el proyecto.
                require(main);

            }

       }

    }

    get list(){

        let files = '{' + PROJECT_PLUGINS_OFFICIAL + ',' + PROJECT_PLUGINS_CUSTOM + '}/*/config.json'
        let output = ''

        for(let file of glob.sync(files)){

            let json = JSON.parse(readFileSync(file, 'utf8'))

            if(json.plugin){

                output += json.plugin.name + ' - ' + json.plugin.version + '\n'
                
            }

        }

        return output

    }

}

export default Plugins
