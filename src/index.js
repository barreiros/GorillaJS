#! /usr/bin/env node

/**
 *
 * Please, read the license: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
 *
 **/

import { argv } from 'yargs'
import Plugins from './class/Plugins.js'
import Processes from './class/Processes.js'
import Schema from './class/Schema.js'
import Project from './class/Project.js'
import { license } from './class/License.js'

class Main {

    constructor(){

        // Inicio la licencia.
        license.check((type) => {

            // Continúo 
            this.router()

        })

    }

    router(){

        // Compruebo la entrada del usuario.
        if(process.env.hasOwnProperty('SUDO_USER')){

            // Error: No se puede usar sudo.
            
        }else if(argv._[0] === 'license'){

            // Imprimo el logo.

            // Añado la licencia.
            if(argv._[1]){

                license.add(argv._[1])

            }else{

                // Error de número de licencia no existe.

            }

        }else if(argv._[0] === 'plugin'){

            // Imprimo el logo.

            if(license.type === 'PRO'){

                // Instancio la clase Plugins
                let plugins = new Plugins()

                if(argv._[1] === 'add'){

                }else if(argv._[1] === 'remove'){

                }else if(argv._[1] === 'list'){

                }

            }

        }else if(argv._[0] === 'template'){

            // Imprimo el logo.

            if(license.type === 'PRO'){

                // Instancio la clase Plugins
                // let templates = new Templates()
                //
                // if(argv._[1] === 'add'){
                //
                // }else if(argv._[1] === 'remove'){
                //
                // }else if(argv._[1] === 'list'){
                //
                // }

            }

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

            let schema = new Schema(argv.force)
            let json = schema.list
            
            if(argv.project){ // Si en la llamada viene el parámetro "project" devuelvo también el gorillafile con la configuración del proyecto.

                // El constructor de la clase Project permite pasarle el path hacia un proyecto concreto.
                let project = new Project()
                json.config = project.config

            }

            // Devuelvo el json.
            console.log(JSON.stringify(json))

        }

    }

}

new Main()


