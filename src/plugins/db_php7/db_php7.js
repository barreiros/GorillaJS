import { PROJECT_ENV, PROJECT_PATH, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { events } from '../../class/Events.js'
import { argv } from 'yargs'
import { execSync } from '../../class/Tools.js'
import { copySync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import yaml from 'yamljs'

class DBforPHP7{

    constructor(){

        events.subscribe('BEFORE_REPLACE_VALUES', (config, templateTarget) => this.copyTemplate(config, templateTarget))
        events.subscribe('AFTER_REPLACE_VALUES', (config, templateTarget) => this.configureEngine(config, templateTarget))
        events.subscribe('PROJECT_BUILT', this.commitSettings)

        // Configuro la opción de añadir una base de datos extra a cualquier proyecto.
        if(argv._[0] === 'dbx'){

            this.addExtraDB(argv._[1])

        }

    }

    addExtraDB(engine){

        let project = new Project()
        let config = project.config

        let validEngines = ['mysql', 'postgresql', 'mongodb']

        if(validEngines.indexOf(engine) !== -1){

            if(!config[PROJECT_ENV].hasOwnProperty('database_extra')){

                config[PROJECT_ENV].database_extra = {}
                config[PROJECT_ENV].database_extra.engines = []

            }

            // Solo se permite un engine extra de cada tipo y compartiran las credenciales.
            if(config[PROJECT_ENV].database_extra.engines.indexOf(engine) === -1){

                config[PROJECT_ENV].database_extra.enable = "yes"
                config[PROJECT_ENV].database_extra.engines.push(engine)

                project.saveValue(config)

            }

            console.log('Please, rebuild the project to install the new database')

        }else{

            console.log('Error - Missing or invalid engine. Valid engines are mysql, postgresql and mongodb.')

        }


    }

    copyTemplate(config, templateTarget){

        let engines = this.getEngines(config)

        if(engines.length > 0){

            let webFile = path.join(templateTarget, 'entrypoint-web.sh')

            // Cargo el contenido del archivo.
            let text = readFileSync(webFile).toString()

            let hasChange = false

            // Creo una expresión regular en lazy mode para que coja todos los valores, aunque haya varios en la misma línea.
            text = text.replace(/\n/, (search, value) => {

                hasChange = true

                // Pendiente optimizar esta parte.
                // Instalo todas las librerías relacionadas con los motores de base de datos que pueda necesitar.
                return '\n apk update && apk add --no-cache postgresql postgresql-dev php7-pgsql mariadb-dev mariadb-dev php7-mongodb &&'

            })

            // Vuelvo a guardar el contenido del archivo con los nuevos valores.
            if(hasChange){

                writeFileSync(webFile, text)

            }

            for(let engine of engines){
                
                if(engine === 'postgresql'){

                    copySync(path.join(__dirname, 'entrypoint-postgresql.sh'), path.join(templateTarget, 'entrypoint-postgresql.sh'))
                    copySync(path.join(__dirname, 'postgresql.conf'), path.join(templateTarget, 'postgresql.conf'))
                    copySync(path.join(__dirname, 'docker-compose-postgresql.yml'), path.join(templateTarget, 'docker-compose-postgresql.yml'))
                    // copySync(path.join(__dirname, 'index-postgresql.php'), path.join(templateTarget, 'test-postgresql.php'))

                }else if(engine === 'mysql'){

                    copySync(path.join(__dirname, 'entrypoint-mysql.sh'), path.join(templateTarget, 'entrypoint-mysql.sh'))
                    copySync(path.join(__dirname, 'docker-compose-mysql.yml'), path.join(templateTarget, 'docker-compose-mysql.yml'))
                    // copySync(path.join(__dirname, 'index-mysql.php'), path.join(templateTarget, 'test-mysql.php'))

                }else if(engine === 'mongodb'){

                    copySync(path.join(__dirname, 'entrypoint-mongo.sh'), path.join(templateTarget, 'entrypoint-mongo.sh'))
                    copySync(path.join(__dirname, 'mongo-create-user'), path.join(templateTarget, 'mongo-create-user'))
                    copySync(path.join(__dirname, 'docker-compose-mongo.yml'), path.join(templateTarget, 'docker-compose-mongo.yml'))
                    // copySync(path.join(__dirname, 'index-mongo.php'), path.join(templateTarget, 'test-mongo.php'))

                }

            }

        }

    }

    configureEngine(config, templateTarget){

        let engines = this.getEngines(config)

        if(engines.length > 0){

            let file = yaml.load(path.join(templateTarget, 'docker-compose.yml'))

            if(!file.services['web'].dependes_on){

                file.services['web'].depends_on = []

            }

            for(let engine of engines){

                if(engine === 'postgresql'){

                    let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-postgresql.yml'))

                    file.services['postgresql'] = engineFile.services.postgresql;
                    file.services['web'].depends_on.push('postgresql');
                    writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6))

                }else if(engine === 'mysql'){

                    let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-mysql.yml'))

                    file.services['mysql'] = engineFile.services.mysql;
                    file.services['web'].depends_on.push('mysql');
                    writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6))

                }else if(engine === 'mongodb'){

                    let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-mongo.yml'))

                    file.services['mongo'] = engineFile.services.mongo;
                    file.services['web'].depends_on.push('mongo');
                    writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6))

                }

            }

        }

    }

    getEngines(config){

        // Compruebo si la template es php 7 o si hay instalaciones extra de bases de datos.
        let engines = []

        // Compruebo si la plantilla es de tipo php 7 y si tiene un engine asociado.
        if(config.docker.template_type === 'php-7'){

            if(config.database.hasOwnProperty('engine_php7')){

                engines.push(config.database.engine_php7.toLowerCase())

            }
            
        }

        // Compruebo si el proyecto tiene algún engine extra. Esto puede tenerlo cualquier proyecto, no solo los que usen la template de php 7.
        if(config.hasOwnProperty('database_extra')){

            if(config.database_extra.hasOwnProperty('engines')){

                for(let engine of config.database_extra.engines){

                    if(engines.indexOf(engine) === -1){

                        engines.push(engine)

                    }
                    
                }

            }

        }

        return engines

    }

    commitSettings(config){

        // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
        if(config.docker.template_type === 'php-7'){

            if(!config.services || FORCE){ // Si no he hecho ningún commit, lo creo para guardar la configuración.

                // let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

            }

        }

    }

}

export default new DBforPHP7() 
