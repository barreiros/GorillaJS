import { PROJECT_PATH, DATA_PATH, PROJECT_ENV, PROJECT_IS_LOCAL, PROXY_PATH, SYSTEM_HOSTS_FILE } from '../const.js'
import Plugins from './Plugins.js'
import Schema from './Schema.js'
import Project from './Project.js'
import Questions from './Questions.js'
import { events } from './Tools.js'
import { merge } from 'merge-json'

class Processes{

    constructor(){

    }

    build(){

        // Inicio los plugins
        let plugins = new Plugins()

        // Recupero el schema.
        let schema = new Schema()

        // Recupero el proyecto.
        let project = new Project()

        // Hago las preguntas. Le paso la configuración del entorno actual del proyecto para no repetir preguntas.
        let questions = new Questions(schema.list, project.config[PROJECT_ENV])

        // Las llamadas a las preguntas son asíncronas, así que tengo que esperar al callback para seguir haciendo cualquier operación.
        questions.process((config) => {
            
            let jsonEnv = {}
            let jsonComplementary = {}

            // Guardo la configuración del entorno actual en el archivo gorillafile
            jsonEnv[PROJECT_ENV] = config 
            project.saveValue(jsonEnv)

            // Complemento la configuración con otros valores necesarios, como el puerto del proxy, paths, etc.
            jsonComplementary[PROJECT_ENV] = {
                "proxy": {
                    "port": 80,
                    "userpath": PROXY_PATH
                },
                "project": {
                    "slug": project.slug,
                    "protocol": "http",
                    "islocal": PROJECT_IS_LOCAL
                },
                "docker": {
                    "port": Math.floor(Math.random() * (4999 - 4000)) + 4000,
                    "data_path": DATA_PATH 
                }
            }
            
            // Unifico las variables complementarias con la configuración general.
            config = merge(jsonComplementary, config)
            
            // Lanzo un evento con la configuración por si los plugins necesitan aplicar algún cambio. 
            events.publish('PLUGINS_MODIFY_CONFIG', [config])

            // console.log(config)

            // Muevo los archivos de la plantilla hasta su destino.

            // Reemplazo las variables de las plantillas por su valor correspondiente del objeto con la configuración que le paso.


            // Complemento el objeto de respuestas con variables / constantes para las que no son necesarias preguntas.
            // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
            //
            // Inicio las máquinas de Docker.
            //
            // Compruebo que el proyecto se haya iniciado correctamente.

        })

    }

    run(){

        console.log('Run')

    }

    stop(){
        
        console.log('Stop')

    }

}

export default Processes 
