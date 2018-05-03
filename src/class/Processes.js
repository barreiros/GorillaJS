import { PROJECT_PATH, PROXY_PATH, DATA_PATH, PROJECT_ENV, PROJECT_PORT, PROJECT_IS_LOCAL, PROJECT_TEMPLATES_OFFICIAL, PROJECT_TEMPLATES_CUSTOM, SYSTEM_HOSTS_FILE, HOME_USER_PATH_FOR_BASH } from '../const.js'
import Plugins from './Plugins.js'
import Schema from './Schema.js'
import Project from './Project.js'
import Questions from './Questions.js'
import Docker from './Docker.js'
import { events } from './Events.js'
import { addToHosts, checkHost } from './Tools.js'
import { merge } from 'merge-json'
import { license } from './License.js'
import { lstatSync, readFileSync, writeFileSync } from 'fs'
import { pathExistsSync, copySync, removeSync } from 'fs-extra'
import path from 'path'
import JSPath from 'jspath'
import glob from 'glob'
import open from 'open'

class Processes{

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
                    "port": PROJECT_PORT,
                    "userpath": path.join(HOME_USER_PATH_FOR_BASH, 'gorillajs', 'proxy')
                },
                "project": {
                    "slug": project.slug,
                    "protocol": "http",
                    "islocal": PROJECT_IS_LOCAL
                },
                "docker": {
                    "port": Math.floor(Math.random() * (4999 - 4000)) + 4000,
                    "data_path": path.join(HOME_USER_PATH_FOR_BASH, 'gorillajs', 'data')
                }
            }
            
            // Unifico las variables complementarias con la configuración general.
            config = merge(jsonComplementary, config)
            
            // Lanzo un evento con la configuración por si los plugins necesitan aplicar algún cambio. 
            events.publish('CONFIG_FILE_CREATED', [config])

            let proxySource = path.join(PROJECT_TEMPLATES_OFFICIAL, 'proxy')
            let proxyTarget = path.join(PROXY_PATH, 'template')
            let templateSource = pathExistsSync(path.join(PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type)) ? path.join(PROJECT_TEMPLATES_OFFICIAL, config.docker.template_type) : path.join(PROJECT_TEMPLATES_CUSTOM, config.docker.template_type)
            let templateTarget = path.join(PROJECT_PATH, '.gorilla', 'template')

            // Muevo los archivos de la plantilla y el proxy hasta su destino.
            copySync(proxySource, proxyTarget)
            copySync(templateSource, templateTarget)

            // Lanzo un evento antes de reemplazar los valores por si algún plugin necesita añadir archivos a la template. Le paso la ruta de la plantilla.
            events.publish('BEFORE_REPLACE_VALUES', [config, templateTarget, proxyTarget])

            // Reemplazo las variables de la plantilla y del proxy por su valor correspondiente del objeto con la configuración que le paso.
            for(let file of glob.sync('{' + templateTarget + '**/*,' + proxyTarget + '/**/*}')){

                if(!lstatSync(file).isDirectory()){

                    // Cargo el contenido del archivo.
                    let text = readFileSync(file).toString()

                    let hasChange = false

                    // Creo una expresión regular en lazy mode para que coja todos los valores, aunque haya varios en la misma línea.
                    text = text.replace(/{{(.*?)}}/g, (search, value) => {
                    
                        hasChange = true
                        // Reemplazo las ocurrencias por su valor correspondiente de la configuración.
                        return JSPath.apply('.' + value, config)[0]

                    })

                    // Vuelvo a guardar el contenido del archivo con los nuevos valores.
                    if(hasChange){

                        writeFileSync(file, text)

                    }

                }

            }

            // Lanzo un evento antes de reemplazar los valores por si algún plugin necesita añadir archivos a la template. Le paso la ruta de la plantilla.
            events.publish('AFTER_REPLACE_VALUES', [config, templateTarget, proxyTarget])

            let docker = new Docker()

            if(docker.check()){

                let composeFile = path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml')

                // Me aseguro de que existe la red común de GorillaJS.
                docker.network()

                // Me aseguro de que todos los contenedores tengan nombre.
                docker.nameContainers(composeFile, config.project.domain)

                // Asigno los contenedores personalizados que he creado con commit.
                docker.assignCustomContainers(composeFile, config)

                // Detengo los contenedores del proyecto.
                docker.stop(composeFile, project.slug)

                // Inicio los contenedores del proyecto.
                docker.start(composeFile, project.slug)

                // Detengo el contenedor del proxy.
                docker.stop(path.join(PROXY_PATH, 'template', 'docker-compose.yml'), 'gorillajsproxy')

                // Inicio el contenedor del proxy.
                docker.start(path.join(PROXY_PATH, 'template', 'docker-compose.yml'), 'gorillajsproxy')
                
                // Si es un proyecto local añado una nueva entrada al archivo hosts.
                addToHosts(config.project.domain, () => {

                    // Compruebo que el proyecto se haya iniciado correctamente.
                    checkHost('http://' + config.project.domain + ':' + config.proxy.port, () => {

                        events.publish('PROJECT_BUILT', [config])

                        if(PROJECT_IS_LOCAL){ // Si es un proyecto local, abro el navegador.

                            open('http://' + config.project.domain + ':' + config.proxy.port + '/gorilla-maintenance')

                        }

                    })

                })

            }else{

                // Error Docker no está encendido o no está instalado.

            }

        })

    }

    run(){

        let docker = new Docker()

        if(docker.check()){

            // Recupero el proyecto.
            let project = new Project()

            let composeFile = path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml')

            // Inicio los contenedores del proyecto.
            docker.start(composeFile, project.slug, false)

            // Inicio el contenedor del proxy.
            docker.start(path.join(PROXY_PATH, 'template', 'docker-compose.yml'), 'gorillajsproxy')

        }

    }

    stop(all = false){
        
        let docker = new Docker()

        if(docker.check()){

            if(all){ // Detengo todos los proyectos

                docker.stop(null)

            }else{

                // Recupero el proyecto.
                let project = new Project()

                let composeFile = path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml')

                // Detengo los contenedores del proyecto.
                docker.stop(composeFile, project.slug)

            }

        }

    }

    remove(){

        let docker = new Docker()

        if(docker.check()){

            // Recupero el proyecto.
            let project = new Project()

            let composeFile = path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml')
            let config = project.config[PROJECT_ENV]

            // Detengo los contenedores del proyecto.
            docker.stop(composeFile, project.slug)

            // Elimino la carpeta de gorilla del proyecto.
            removeSync(path.join(PROJECT_PATH, '.gorilla'))
            
            // Elimino la carpeta de la base de datos.
            removeSync(path.join(DATA_PATH, config.project.id))

            // Envío un evento por si algún plugin necesita eliminar algo.
            events.publish('PROJECT_REMOVED', [config])

        }

    }

    maintenanace(){

        let docker = new Docker()

        if(docker.check()){

            // Recupero el proyecto.
            let project = new Project()

            let config = project.config[PROJECT_ENV]

            // Ejecuto el mantenimiento de Docker
            docker.maintenance()

            // Envío un evento por si algún plugin necesita hacer labores de mantenimiento.
            events.publish('PROJECT_MAINTENANCE', [config])

        }

    }

    commit(name){

        if(typeof name === 'undefined' || name === ''){

            let project = new Project()
            let config = project.config[PROJECT_ENV]

            name = config.project.domain

        }

        let docker = new Docker()

        docker.commit(path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml'), path.join(PROJECT_PATH, '.gorilla', 'gorillafile'), name)

    }

}

export default Processes 
