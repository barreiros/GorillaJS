import { PROJECT_PATH, PROJECT_ENV } from '../const.js'
import Schema from './Schema.js'
import Project from './Project.js'
import Questions from './Questions.js'

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
        questions.process((answers) => {
            
            let jsonEnv = {}

            // Guardo la configuración del entorno actual en el archivo gorillafile
            jsonEnv[PROJECT_ENV] = answers
            project.saveValue(jsonEnv)

            // Complemento el objeto de respuestas con variables / constantes para las que no son necesarias preguntas.
            // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
            // proxy.port
            // proxy.host
            // proxy.userpath
            // system.hostsfile
            // project.id
            // project.slug
            // project.protocol
            // project.islocal
            // docker.port
            // docker.data_path
            // docker.template
            // docker.template_path
            // docker.template.slug
            // docker.gorillafolder ¿¿??
            // docker.template_folder ¿¿??
            //
            // Guardo los resultados en el nodo del entorno del gorillafile.
            //
            // Muevo los archivos de la plantilla hasta su destino.
            //
            // Reemplazo las variables de las plantillas por su valor correspondiente del archivo de configuración.
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
