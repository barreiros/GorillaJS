import { PROJECT_PATH, DATA_PATH, PROJECT_ENV, PROJECT_IS_LOCAL, PROJECT_TEMPLATES_OFFICIAL, PROJECT_TEMPLATES_CUSTOM, PROXY_PATH, SYSTEM_HOSTS_FILE } from '../const.js'
import Plugins from './Plugins.js'
import Schema from './Schema.js'
import Project from './Project.js'
import Questions from './Questions.js'
import Docker from './Docker.js'
import { events } from './Tools.js'
import { merge } from 'merge-json'
import { license } from './License.js'
import { lstatSync, readFileSync, writeFileSync } from 'fs'
import { pathExistsSync, copySync } from 'fs-extra'
import path from 'path'
import JSPath from 'jspath'
import glob from 'glob'

class Processes{

    constructor(){

    }

    build(){

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

            // Completo la configuración con otros valores necesarios, como el puerto del proxy, paths, etc.
            jsonComplementary = {
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
            events.publish('CONFIG_FILE_CREATED', [config])

            // Muevo los archivos de la plantilla hasta su destino.
            let templateSource = pathExistsSync(path.join(PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type)) ? path.join(PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type) : path.join(PROJECT_TEMPLATES_CUSTOM, config.docker.template_type)
            let templateTarget = path.join(PROJECT_PATH, '.gorilla', 'template')

            copySync(templateSource, templateTarget)

            // Lanzo un evento antes de reemplazar los valores por si algún plugin necesita añadir archivos a la template. Le paso la ruta de la plantilla.
            events.publish('BEFORE_REPLACE_VALUES', [templateTarget])

            // Reemplazo las variables de la plantilla y del proxy por su valor correspondiente del objeto con la configuración que le paso.
            for(let file of glob.sync('{' + templateTarget + '**/*,' + PROJECT_TEMPLATES_OFFICIAL + '/proxy/**/*}')){

                if(!lstatSync(file).isDirectory()){

                    // Cargo el contenido del archivo.
                    let text = readFileSync(file).toString()

                    // Creo una expresión regular en lazy mode para que coja todos los valores, aunque haya varios en la misma línea.
                    text = text.replace(/{{(.*?)}}/g, (search, value) => {
                    
                        // Reemplazo las ocurrencias por su valor correspondiente de la configuración.
                        return JSPath.apply('.' + value, config)[0]

                    })

                    // Vuelvo a guardar el contenido del archivo con los nuevos valores.
                    writeFileSync(file, text)

                }

            }

            let docker = new Docker()

            if(docker.check()){

                // Detengo los contenedores del proyecto.
                docker.stop(path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml'), project.slug)

                // Inicio los contenedores del proyecto.
                docker.start(path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml'), project.slug)

                // Detengo el contenedor del proxy.
                docker.stop(path.join(PROJECT_TEMPLATES_OFFICIAL, 'proxy', 'docker-compose.yml'), 'gorillajsproxy')

                // Inicio el contenedor del proxy.
                docker.start(path.join(PROJECT_TEMPLATES_OFFICIAL, 'proxy', 'docker-compose.yml'), 'gorillajsproxy')
                
            }else{

                // Error Docker no está arranco o no está instalado.

            }

            events.publish('PROJECT_BUILT')

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
