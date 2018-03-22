import { PROJECT_PATH, SCHEMA_PATH, PROJECT_TEMPLATES_OFFICIAL, PROJECT_TEMPLATES_CUSTOM, PROJECT_PLUGINS_OFFICIAL, PROJECT_PLUGINS_CUSTOM} from '../const.js'
import { pathExistsSync } from 'fs-extra'
import fs from 'fs'
import glob from 'glob'

class Schema{

    constructor(){

    }

    process(){

        if(!pathExistsSync(SCHEMA_PATH)){ // Si no existe el archivo, lo genero.

            // Busco todos los archivos config.json de las carpetas de templates y plugins oficiales y personalizados.
            let files = '{' + PROJECT_TEMPLATES_OFFICIAL + ', ' + PROJECT_TEMPLATES_CUSTOM + ', ' + PROJECT_PLUGINS_OFFICIAL + ', ' + PROJECT_PLUGINS_CUSTOM + '}/**/config.json'

            for(let file of glob.sync(files)){

                let json = JSON.parse(fs.readFileSync(file, 'utf8'))

                console.log(file)

            }

        }

        // return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))

    }

}

export default Schema
