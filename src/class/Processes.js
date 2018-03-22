import { PROJECT_PATH } from '../const.js'

class Processes{

    constructor(){

    }

    build(){

        console.log('Build')

        // Una vez recuperado el schema y hechas las preguntas todavía quedarán algunas variables de las plantillas que no están contempladas. Por ejemplo, docker.port. 
        // Los valores para estas variables los podría añadir directamente al gorillafile antes de iniciar el proceso de reemplazo.
        // project.id
        // project.slug
        // docker.port
        // docker.data_path

    }

    run(){

        console.log('Run')

    }

    stop(){
        
        console.log('Stop')

    }

}

export default Processes 
