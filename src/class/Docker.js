import { PROJECT_PATH, PROJECT_ENV } from '../const.js'
import { execSync } from './Tools.js'
import { writeFileSync, readFileSync } from 'fs'
import path from 'path'
import yaml from 'yamljs'

class Docker{

    check(){

        let query

        // Compruebo si docker está instalado y funcionando.
        query = execSync('docker ps')

        if(query.err){

            return false

        }

        // Compruebo si docker está instalado y funcionando.
        query = execSync('docker-compose -v')

        if(query.err){

            return false

        }

        return true

    }

    start(composeFile, slug, force = true){

        let command

        if(force){

            command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --remove-orphans --force-recreate -d'

        }else{

            command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --remove-orphans -d'

        }

        execSync(command)

    }

    stop(composeFile, slug){

        if(!composeFile){

            execSync('docker stop $(docker ps -aq) && docker rm $(docker ps -aq)')

        }else{

            execSync('docker-compose -p "' + slug + '" rm -f -s -v', {
                cwd: path.dirname(composeFile)
            })

        }
    }

    nameContainers(composeFile, name){

        let file = yaml.load(composeFile)

        for(let key in file.services){

            if(!file.services[key].container_name){

                file.services[key].container_name = name + '_' + key;

            }

        }

        writeFileSync(composeFile, yaml.stringify(file, 6)); 

    }

    assignCustomContainers(composeFile, config){

        if(config.services){

            let file = yaml.load(composeFile)

            for(let key in config.services){

                if(file.services[key]){

                    file.services[key].image = config.services[key]

                }

            }

            writeFileSync(composeFile, yaml.stringify(file, 6)); 

        }

    }

    commit(composeFile, gorillaFile, name){

        if(name === 'gorillajsproxy'){

            execSync('docker commit -p=false gorillajsproxy gorillajs/proxy')

        }else{

            let file = yaml.load(composeFile)
            let config = JSON.parse(readFileSync(gorillaFile))
            let service
        
            for(key in file.services){

                if(file.services[key].container_name === name){

                    service = key;

                    break

                }

            }

            if(service){

                let image

                if(config[PROJECT_ENV].services){

                    for(var key in config[PROJECT_ENV].services){

                        if(config[PROJECT_ENV].services[key] === service){

                            image = config[PROJECT_ENV].services[key];

                        }

                    }

                }else{

                    config[PROJECT_ENV].services = {}

                }

                // Si no existía una imagen creada para este servicio, genero el nombre (project.ID* + service.name).
                if(!image){

                    image = config[PROJECT_ENV].project.id + '/' + service;

                    // Actualizo el gorillafile con el nombre 
                    config[PROJECT_ENV].services[service] = image

                    writeFileSync(gorillaFile, JSON.stringify(config, null, '\t'));

                }

                // Creo el commit pasándole name e image.
                execSync('docker commit -p=false ' + name + ' ' + image)

            }else{

                // Error no existe un contenedor con ese nombre.
                
            }

        }

    }

    network(){

        let containers = execSync('docker network ls --format="{{.Name}}"')

        if(containers.stdout.search('gorillajs') === -1){

            execSync('docker network create --driver bridge gorillajs')

        }

    }

    maintenance(){

        // Elimino los contenedores, redes e imágenes que no se usan.
        execSync('docker system prune -af')

        // Estudiar si es viable usar esta librería para controlar el error de max depth exceed: https://github.com/goldmann/docker-squash

    }

}

export default Docker
