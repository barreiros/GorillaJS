import { PROJECT_ENV, PROJECT_PATH, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { events } from '../../class/Events.js'
import { execSync } from '../../class/Tools.js'
import { copySync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import { argv } from 'yargs'
import path from 'path'
import yaml from 'yamljs'
import pty from 'pty.js'

class Varnish{

    constructor(){

        events.subscribe('BEFORE_REPLACE_VALUES', this.copyTemplate)
        events.subscribe('AFTER_REPLACE_VALUES', this.configureEngine)
        events.subscribe('PROJECT_BUILT', this.commitSettings)

        this.init()

    }

    init(){

        if(argv._[0] === 'varnish'){

            let project = new Project()
            let config = project.config[PROJECT_ENV]

            if(argv._[1] === 'reload'){

                this.reloadConfig(config)

            }else if(argv._[1] === 'admin'){

                this.executeCommand(config.project.domain + '_varnish', 'varnishadm')

            }

        }

    }

    copyTemplate(config, templateTarget, proxyTarget){

        // Si Varnish está activado...
        if(config.varnish.enable === 'yes'){

            // Copio los archivos de la plantilla de varnish.
            copySync(path.join(__dirname, 'entrypoint-varnish.sh'), path.join(templateTarget, 'entrypoint-varnish.sh'));
            copySync(path.join(__dirname, 'docker-compose-varnish.yml'), path.join(templateTarget, 'docker-compose-varnish.yml'));

            // Cambio la configuración del virtualhost en el proxy para que apunte al contenedor de Varnish en lugar de al front del proyecto.
            let proxyFile = readFileSync(path.join(proxyTarget, 'apache-proxy.conf'), 'utf8')

            if(proxyFile){

                proxyFile = proxyFile.replace(/ProxyPass \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPass \/ http:\/\/\{\{project.domain\}\}_varnish\/')
                proxyFile = proxyFile.replace(/ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}_varnish\/')
                writeFileSync(path.join(proxyTarget, 'apache-proxy.conf'), proxyFile)

            }

            proxyFile = readFileSync(path.join(proxyTarget, 'apache-proxy-ssl.conf'), 'utf8')

            if(proxyFile){

                proxyFile = proxyFile.replace(/ProxyPass \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPass \/ http:\/\/\{\{project.domain\}\}_varnish\/')
                proxyFile = proxyFile.replace(/ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}\//g, 'ProxyPassReverse \/ http:\/\/\{\{project.domain\}\}_varnish\/')
                writeFileSync(path.join(proxyTarget, 'apache-proxy-ssl.conf'), proxyFile)

            }

        }

    }

    configureEngine(config, templateTarget){

        if(config.varnish.enable === 'yes'){

            let file = yaml.load(path.join(templateTarget, 'docker-compose.yml'))

            let varnishFile = yaml.load(path.join(templateTarget, 'docker-compose-varnish.yml'))

            file.services['varnish'] = varnishFile.services.varnish;
            writeFileSync(path.join(templateTarget, 'docker-compose.yml'), yaml.stringify(file, 6)); 

        }

    }

    commitSettings(config){

        // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
        if(config.varnish.enable === 'yes'){

            if(!config.services || FORCE){ // Si no he hecho ningún commit, lo creo para guardar la configuración.

                let query = execSync('gorilla6 commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

            }

        }

    }

    reloadConfig(config){

        if(config.varnish.enable === 'yes'){

            let rand = Math.floor(Math.random() * (1000 - 0 + 1) + 0)

            let query = execSync('docker exec ' + config.project.domain + '_varnish varnishadm vcl.load reload_' + rand + ' /etc/varnish/default.vcl')

            if(!query.err){

                query = execSync('docker exec ' + config.project.domain + '_varnish varnishadm vcl.use reload_' + rand)

                console.log('Varnish caché reloaded!')
                    
            }else{

                console.log(query)

            }

        }

    }

    executeCommand(container, type, args){

        let stdin = process.openStdin();
        let command

        if(type === 'varnishadm'){

            command = ['exec', '-it', container, type]

        }else{
            
            command = ['exec', '-it', container, type].concat(args.split(" "))

        }

        let term = pty.spawn('docker', command, {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        })

        term.on('data', function(data) {

            process.stdout.write(data)

        })

        term.on('close', function(code) {
            
            process.exit()
            process.stdin.destroy()

        })

        stdin.addListener('data', function(data){

            term.write(data.toString())

        })

    }

}

export default new Varnish() 