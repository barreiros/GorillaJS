#! /usr/bin/env node

import { argv } from 'yargs'
import Plugins from './class/Plugins.js'
import Processes from './class/Processes.js'
import Schema from './class/Schema.js'

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

            let processes = new Processes()
            processes.build()
            
        }else if(argv._[0] === 'run'){

            // Imprimo el logo.
            
            let processes = new Processes()
            processes.run()

        }else if(argv._[0] === 'stop'){

            // Imprimo el logo.
            
            let processes = new Processes()
            processes.stop()
            
        }else if(argv._[0] === 'schema'){

            let schema = new Schema()
            
            return schema.process()

        }

        console.log(argv)

    }

}

new Main()


