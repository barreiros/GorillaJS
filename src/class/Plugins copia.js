import { PROJECT_TEMPLATES_OFFICIAL, PROJECT_TEMPLATES_CUSTOM } from '../const.js'
import { pathExistsSync, ensureFileSync, copySync, removeSync } from 'fs-extra'
import { lstatSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import glob from 'glob'
import path from 'path'

class Templates {

    constructor(){

        // Recupero todos los plugins.
        let files = '{' + PROJECT_TEMPLATES_OFFICIAL + ',' + PROJECT_TEMPLATES_CUSTOM + '}/*/config.json'

    }


    add(source){

        source = path.resolve(source)

        if(pathExistsSync(source)){

            copySync(source, path.join(PROJECT_TEMPLATES_CUSTOM, path.basename(source)));

        }else{

            // Error carpeta no existe.

        }

    }

    remove(name){

        let template = path.join(PROJECT_TEMPLATES_CUSTOM, name)

        if(pathExistsSync(template)){

            // Elimino la plantilla
            removeSync(template)

        }

    }

    get list(){

        let files = '{' + PROJECT_TEMPLATES_OFFICIAL + ',' + PROJECT_TEMPLATES_CUSTOM + '}/*'
        let output = ''

        for(let file of glob.sync(files)){

            if(lstatSync(file).isDirectory()){

                output += path.basename(file) + '\n'
                
            }

        }

        return output

    }

}

export default Templates
