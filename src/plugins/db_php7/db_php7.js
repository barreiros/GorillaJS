import { PROJECT_ENV, PROJECT_PATH, FORCE } from '../../const.js'
import { events } from '../../class/Events.js'
import { execSync } from '../../class/Tools.js'
import { copySync } from 'fs-extra'
import { writeFileSync } from 'fs'
import path from 'path'
import yaml from 'yamljs'

class DBforPHP7{

    constructor(){

        events.subscribe('BEFORE_REPLACE_VALUES', this.copyTemplate)
        events.subscribe('AFTER_REPLACE_VALUES', this.configureEngine)
        events.subscribe('PROJECT_BUILT', this.commitSettings)

    }

    copyTemplate(config, templateTarget){

        // Si el proyecto es de PHP7, copio los archivos del motor de base de datos a la carpeta de la plantilla.
        if(config.docker.template_type === 'php7'){

            let engine = config.database.engine_php7.toLowerCase()

            if(engine === 'postgresql'){

                copySync(path.join(__dirname, 'entrypoint-web.sh'), path.join(templateTarget, 'entrypoint-web.sh'));

                copySync(path.join(__dirname, 'entrypoint-postgresql.sh'), path.join(templateTarget, 'entrypoint-postgresql.sh'));
                copySync(path.join(__dirname, 'postgresql.conf'), path.join(templateTarget, 'postgresql.conf'));
                copySync(path.join(__dirname, 'index-postgresql.php'), path.join(templateTarget, 'index.php'));
                copySync(path.join(__dirname, 'docker-compose-postgresql.yml'), path.join(templateTarget, 'docker-compose-postgresql.yml'));

            }else if(engine === 'mysql'){

                copySync(path.join(__dirname, 'entrypoint-web.sh'), path.join(templateTarget, 'entrypoint-web.sh'));

                copySync(path.join(__dirname, 'entrypoint-mysql.sh'), path.join(templateTarget, 'entrypoint-mysql.sh'));
                copySync(path.join(__dirname, 'index-mysql.php'), path.join(templateTarget, 'index.php'));
                copySync(path.join(__dirname, 'docker-compose-mysql.yml'), path.join(templateTarget, 'docker-compose-mysql.yml'));

            }else if(engine === 'mongodb'){

                copySync(path.join(__dirname, 'entrypoint-web.sh'), path.join(templateTarget, 'entrypoint-web.sh'));

                copySync(path.join(__dirname, 'entrypoint-mongo.sh'), path.join(templateTarget, 'entrypoint-mongo.sh'));
                copySync(path.join(__dirname, 'mongo-create-user'), path.join(templateTarget, 'mongo-create-user'));
                copySync(path.join(__dirname, 'index-mongo.php'), path.join(templateTarget, 'index.php'));
                copySync(path.join(__dirname, 'docker-compose-mongo.yml'), path.join(templateTarget, 'docker-compose-mongo.yml'));

            }

        }

    }

    configureEngine(config, templateTarget){

        if(config.docker.template_type === 'php7'){

            let file = yaml.load(path.join(templateTarget, 'docker-compose.yml'))
            let engine = config.database.engine_php7.toLowerCase()

            if(!file.services['web'].dependes_on){

                file.services['web'].depends_on = []

            }

            if(engine === 'postgresql'){

                let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-postgresql.yml'))

                file.services['postgresql'] = engineFile.services.postgresql;
                file.services['web'].depends_on.push('postgresql');
                writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6)); 

            }else if(engine === 'mysql'){

                let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-mysql.yml'))

                file.services['mysql'] = engineFile.services.mysql;
                file.services['web'].depends_on.push('mysql');
                writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6)); 

            }else if(engine === 'mongodb'){

                let engineFile = yaml.load(path.join(templateTarget, 'docker-compose-mongo.yml'))

                file.services['mongo'] = engineFile.services.mongo;
                file.services['web'].depends_on.push('mongo');
                writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6)); 

            }

        }

    }

    commitSettings(config){

        // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
        if(config.docker.template_type === 'php7'){

            if(!config.services || FORCE){ // Si no he hecho ningún commit, lo creo para guardar la configuración.

                // let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

            }

        }

    }

}

export default new DBforPHP7() 
