import { PROJECT_PATH, PROJECT_ENV } from '../const.js'
import { pathExistsSync, ensureFileSync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import uuid from 'uuid/v4'
import { merge } from 'merge-json'
import JSPath from 'jspath'

class Project {

    constructor(projectPath = PROJECT_PATH){

        this.gorillaFilePath = path.join(projectPath, '.gorilla', 'gorillafile')
        this.projectPath = projectPath

        if(!pathExistsSync(this.gorillaFilePath)){ // Si el archivo gorillafile no existe, creo un nuevo proyecto.

            this.createProject()

        }else{

            this.ensureEnv()

        } 

    }

    ensureEnv(){

        // Recupero la configuración del proyecto y busco el nodo del entorno actual.
        let config = readFileSync(this.gorillaFilePath, 'utf8')

        // Si está vacío, creo un objeto.
        if(config === ''){

            config = {}

        }else{

            config = JSON.parse(config)

        }

        if(!config[PROJECT_ENV]){

            // Busco en toda la configuración el id del proyecto, por si estuviera en otro entorno.
            let id = JSPath.apply('..project.id', config)

            if(id.length){

                config[PROJECT_ENV] = {

                    project: {

                        id: id[0]

                    }

                }

                this.saveValue(config)

            }else{

                this.createProject()

            }

        }   

    }

    createProject(){

        let json

        // Creo el archivo de configuración
        ensureFileSync(this.gorillaFilePath)

        // Genero un ID único para el proyecto y lo guardo en el nuevo archivo de configuració que acabo de crear.
        json = {}
        json[PROJECT_ENV] = {

            project: {

                id: uuid()

            }

        }

        this.saveValue(json)

    }

    clearConfig(force = false){

        // Recupero el actual archivo de configuración.
        let config = JSON.parse(readFileSync(this.gorillaFilePath, 'utf8'))
        let id = config[PROJECT_ENV].project.id

        if(force){ // Elimino la confiración de todos los entornos, excepto el id de proyecto.

            config = {}

        }

        config[PROJECT_ENV] = {

            project: {

                id: id

            }

        }

        writeFileSync(this.gorillaFilePath, JSON.stringify(config, null, '\t'))

    }

    saveValue(value){

        // Recupero el actual archivo de configuración.
        let config = readFileSync(this.gorillaFilePath, 'utf8')

        // Si está vacío, creo un objeto.
        if(config === ''){

            config = {}

        }else{

            config = JSON.parse(config)

        }

        // Concateno el archivo actual con el nuevo valor (que siempre tiene que ser un json / objeto)
        writeFileSync(this.gorillaFilePath, JSON.stringify(merge(config, value), null, '\t'))

    }

    get config(){

        return JSON.parse(readFileSync(this.gorillaFilePath, 'utf8'))

    }

}

export default Project
