import { PROJECT_PATH, PROJECT_ENV, PROXY_PATH, HOME_USER_PATH_FOR_SCRIPTS as HOME } from '../../const.js'
import { events } from '../../class/Events.js'
import { execSync } from '../../class/Tools.js'
import { load } from 'yamljs'
import { pathExistsSync, ensureDirSync, copySync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import yaml from 'yamljs'
import path from 'path'


class Adminer{

    constructor(){

        events.subscribe('PROJECT_BUILT', this.check.bind(this))
        events.subscribe('PROJECT_REMOVED', this.remove.bind(this))
        events.subscribe('PROJECT_MAINTENANCE', this.maintenance.bind(this))

    }

    check(config){

        let adminerPath = path.join(PROXY_PATH, 'template', 'adminer')
        let listFile = path.join(HOME, 'gorillajs', 'adminer.json')

        if(!pathExistsSync(listFile)){ // Me aseguro de que el archivo de configuración existe.

            writeFileSync(listFile, '{}')

        }

        // Cargo el archivo de configuración de Adminer.
        let list = JSON.parse(readFileSync(listFile, 'utf8'))

        ensureDirSync(adminerPath)

        // Compruebo si el proyecto actual existe en el archivo.
        if(!list[config.project.domain]){ // Si no existe, lo añado.

            list[config.project.domain] = {}

            this.add(list[config.project.domain])

            // Guardo la lista actualizada.
            writeFileSync(listFile, JSON.stringify(list, null, '\t'))

            // Copio el listado en la carpeta pública de Adminer.
            copySync(listFile, path.join(adminerPath, 'public', 'list.json'))

        }else if(!pathExistsSync(path.join(adminerPath, 'public', 'list.json'))){ // Si no existe el archivo list en la carpeta pública, lo copio.
            
            // Copio el listado en la carpeta pública de Adminer.
            copySync(listFile, path.join(adminerPath, 'public', 'list.json'))

        } 

        if(!pathExistsSync(path.join(adminerPath, 'public')) || !pathExistsSync(path.join(adminerPath, 'server'))){ // Si los archivos de Adminer no están en la carpeta del proxy, los añado.

            ensureDirSync(adminerPath)

            // Copio todos los archivos de Adminer en la carpeta de la template del proxy. Esto es nuevo y tengo que rectificar los archivos .sh
            copySync(path.join(path.resolve(__dirname), 'public'), path.join(adminerPath, 'public'))
            copySync(path.join(path.resolve(__dirname), 'server'), path.join(adminerPath, 'server'))

            // Ejecuto el script de bash para terminar de configurar Adminer.
            let query = execSync('docker exec gorillajsproxy /bin/sh /root/templates/adminer/server/adminer.sh')

            console.log(query)
            console.log('Hola, Bar')
            
        }

    }

    add(list){

        let composeFile = path.join(PROJECT_PATH, '.gorilla', 'template', 'docker-compose.yml')

        // Creo un array con los motores de adminer.
        let engines = ['mysql', 'mariadb', 'sqlite', 'postgresql', 'mongodb', 'oracle', 'elasticsearch'];

        // Cargo el archivo docker-compose.
        let file = yaml.load(composeFile)

        // Lo parseo en busca de servicios que tengan en el nombre alguna de las cadenas del array "engines"
        for(var service in file.services){

            let containerName = file.services[service].container_name

            engines.map((engine) => {

                // Si el nombre del contenedor incluye el nombre de una tecnología de base de datos, lo incluyo en la lista.
                if(containerName.toLowerCase().search(engine) !== -1){ 

                    list[containerName] = engine

                }

            })

        }

        console.log(list)

    }

    remove(config){

    }

    maintenance(){

    }

}

export default new Adminer() 
