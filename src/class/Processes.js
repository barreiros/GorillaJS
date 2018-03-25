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
            
            console.log(answers)

            // Complemento el objeto de respuestas con variables / constantes para las que no son necesarias preguntas.
            // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
            // project.id
            // project.slug
            // docker.port
            // docker.data_path
            // Guardo los resultados en el nodo del entorno del gorillafile.

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
