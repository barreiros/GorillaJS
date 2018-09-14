#! /usr/bin/env node

/**
 *
 * Please, read the license: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
 *
 **/

import { argv } from 'yargs'
import Templates from './class/Templates.js'
import Plugins from './class/Plugins.js'
import Processes from './class/Processes.js'
import Schema from './class/Schema.js'
import Project from './class/Project.js'
import { license } from './class/License.js'
import SocketGuest from './class/SocketGuest.js'

class Main {

    constructor(){

        // Inicio la licencia.
        license.check((type) => {

            if(license.type === 'PRO'){

                // Instancio la clase Plugins
                this.plugins = new Plugins()

            }

            // Continúo 
            this.router()

        })

    }

    router(){

        // Compruebo la entrada del usuario.
        if(process.env.hasOwnProperty('SUDO_USER')){

            console.log('GorillaJS has detect that you are in SUDOERS list. Please, if necessary, configure your system in order to do not use sudo command.')
            // Error: No se puede usar sudo.
            
        }

        if(argv._[0] === 'license'){

            // Imprimo el logo.

            // Añado la licencia.
            if(argv._[1]){

                license.add(argv._[1])

            }else{

                // Error de número de licencia no existe.

            }

        }else if(argv._[0] === 'plugin' || argv._[0] === 'plugins'){

            // Imprimo el logo.

            if(this.plugins){

                if(argv._[1] === 'add'){

                    this.plugins.add(argv._[2])

                }else if(argv._[1] === 'remove'){

                    this.plugins.remove(argv._[2])

                }else if(argv._[1] === 'list'){

                    console.log(this.plugins.list)

                }else if(argv._[1] === 'reinstall'){

                    this.plugins.reinstall()

                }

            }else{

                // Error de contratación de plan PRO.

            }

        }else if(argv._[0] === 'template' || argv._[0] === 'templates'){

            // Imprimo el logo.

            if(license.type === 'PRO'){

                // Instancio la clase Templates
                let templates = new Templates()

                if(argv._[1] === 'add'){

                    templates.add(argv._[2])

                }else if(argv._[1] === 'remove'){

                    templates.remove(argv._[2])

                }else if(argv._[1] === 'list'){

                    console.log(templates.list)

                }

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
            processes.stop(argv.all)

        }else if(argv._[0] === 'remove'){

            // Imprimo el logo.
            
            let processes = new Processes()
            processes.remove()

        }else if(argv._[0] === 'maintenance'){

            // Imprimo el logo.
            
            let processes = new Processes()
            processes.maintenance()
            
        }else if(argv._[0] === 'commit' || argv._[0] === 'save'){

            // Imprimo el logo.

            let processes = new Processes()
            processes.commit(argv._[1])

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

        }else if(argv._[0] === 'guest'){

            let guest = new SocketGuest()

        }

    }

}

new Main()


