import { PROJECT_ENV, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'
import { execSync } from '../../class/Tools.js'
import { spawn } from 'child_process'
import path from 'path'

class ComposerAndPear{

    constructor(){

        this.init()

    }

    init(){

        if(argv._[0] === 'composer' || argv._[0] === 'pear' || argv._[0] === 'pecl'){

            let project = new Project()
            let config = project.config[PROJECT_ENV]

            this.installDependencies(config)
            this.executeCommand(config, argv._[0], process.argv.slice(3).join(' '))

        }

    }

    checkDependencies(){

    }

    installDependencies(config){

        let query

        // Copio los archivos de configuración al contenedor.
        query = execSync('docker cp "' + path.join(__dirname, 'server', '.') + '" ' + config.project.domain + ':/etc/composer_and_pear')

        // Ejecuto el archivo de configuración.
        query = execSync('docker exec ' + config.project.domain + ' /bin/sh /etc/composer_and_pear/dependencies.sh')

    }

    executeCommand(config, type, args){

        let stdin = process.openStdin();

        let command

        if(type === 'composer'){

            command = ['exec', '-i', config.project.domain, '/usr/local/bin/composer', '--working-dir=' + path.join('/', 'var', 'www', config.project.domain, 'application')].concat(args.split(" "))

        }else{

            command = ['exec', '-i', config.project.domain, type].concat(args.split(" "))

        }

        let query = spawn('docker', command)

        query.stdout.on('data', (data) => {

            process.stdout.write(data)

        })

        query.stderr.on('data', (err) => {

            console.log(err.toString())

        })

        query.on('exit', (code) => {

            // ¿Commit?
            this.commitSettings(config)

            process.stdin.destroy();
            process.exit();

        })

        stdin.addListener('data', (data) => {

            query.stdin.write(data.toString())

        })

    }

    commitSettings(config){

        // Creo el commit únicamente si todavía no existe la imagen de Docker personalizada o si el usuario ha elegido el parámetro -f (FORCE).
        if(config.docker.template_type === 'django'){

            if(!config.services || FORCE){ // Si no he hecho ningún commit, lo creo para guardar la configuración.

                let query = execSync('gorilla6 commit "' + config.project.domain + '" --path "' + PROJECT_PATH + '"')

            }

        }

    }

}

export default new ComposerAndPear() 
