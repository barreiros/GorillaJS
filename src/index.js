#! /usr/bin/env node

import { argv } from 'yargs'
import { PROJECT_PATH } from './const.js'
import Plugins from './class/Plugins.js'
import Build from './class/BuildProcess.js'
import Run from './class/RunProcess.js'
import Stop from './class/StopProcess.js'

class Main {

    constructor(){

        // Genero, si no lo está, el archivo de configuración. Este archivo contiene, entre otras cosas, los textos de error.
        
        // Compruebo la entrada del usuario.
        if(process.env.hasOwnProperty('SUDO_USER')){

            // Error: No se puede usar sudo.

        }else if(argv._[0] === 'plugin'){

            // Imprimo el logo.

            // Instancio la clase Plugins y le paso los parámetros.
            let plugins = new Plugins(argv)

        }else if(argv._[0] === 'build'){

            // Imprimo el logo.

            console.log(PROJECT_PATH)
            
        }else if(argv._[0] === 'run'){

            // Imprimo el logo.
            
        }else if(argv._[0] === 'stop'){

            // Imprimo el logo.
            
        }

        console.log(argv)

    }

}

new Main()


