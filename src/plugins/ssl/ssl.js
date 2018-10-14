import { PROJECT_ENV, PROJECT_PATH, PROJECT_SSL_PORT, FORCE } from '../../const.js'
import { events } from '../../class/Events.js'
import { execSync } from '../../class/Tools.js'
import { copySync } from 'fs-extra'
import { writeFileSync } from 'fs'
import path from 'path'
import yaml from 'yamljs'

class SSL{

    constructor(){

        events.subscribe('BEFORE_REPLACE_VALUES', this.copySSLFiles)
        events.subscribe('BEFORE_REPLACE_VALUES', this.copySSLAppFiles)
        events.subscribe('AFTER_REPLACE_VALUES', this.addSSL)
        events.subscribe('PROJECT_BUILT', this.configureProxy)
        events.subscribe('PROJECT_BUILT', this.configureApp)
        events.subscribe('PROJECT_BUILT', this.commitSettings)

    }

    copySSLAppFiles(config, templateTarget){

        if(config.ssl.enable === 'yes'){

            copySync(path.join(__dirname, 'app.sh'), path.join(templateTarget, 'ssl.sh'));

        }

    }

    copySSLFiles(config, templateTarget, proxyTarget){

        if(config.ssl.enable === 'yes'){

            copySync(path.join(__dirname, 'server'), proxyTarget);

        }

    }

    addSSL(config, templateTarget, proxyTarget){

        if(config.ssl.enable === 'yes'){

            let file = yaml.load(path.join(proxyTarget, 'docker-compose.yml'))

            file.services.proxy.ports.push(PROJECT_SSL_PORT + ':' + PROJECT_SSL_PORT);
            file.services.proxy.volumes.push(config.proxy.userpath + '/letsencrypt:/etc/letsencrypt');

            writeFileSync(path.join(proxyTarget, 'docker-compose.yml'), yaml.stringify(file, 6)); 

        }

    }

    configureProxy(config){

        if(config.ssl.enable === 'yes'){

            let query = execSync('docker exec gorillajsproxy /bin/sh /root/templates/ssl.sh')

        }

    }

    configureApp(config){

        if(config.ssl.enable === 'yes'){

            let query = execSync('docker exec ' + config.project.domain + ' /bin/sh /root/templates/ssl.sh')

        }

    }

    commitSettings(config){

        // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
        if(config.docker.template_type === 'yes'){

            if(!config.services || FORCE){ // Si no he hecho ningún commit, lo creo para guardar la configuración.

                let query = execSync('gorilla commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

            }

        }

    }

}

export default new SSL() 
