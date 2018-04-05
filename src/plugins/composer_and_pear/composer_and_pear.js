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

            if(!this.checkDependencies(config.project.domain) || FORCE){

                this.installDependencies(config.project.domain)

            }

            this.executeCommand(config.project.domain, argv._[0], process.argv.slice(3).join(' '))

        }

    }

    checkDependencies(container){

        let query = execSync('docker exec ' + container + ' [ -e /etc/composer_and_pear ] && echo "OK" || echo "KO"')

        if(query.stdout.search('OK') !== -1){

            return true

        }else{

            return false

        }

    }

    installDependencies(container){

        let query

        // Copio los archivos de configuración al contenedor.
        query = execSync('docker cp "' + path.join(__dirname, 'server', '.') + '" ' + container + ':/etc/composer_and_pear')

        // Ejecuto el archivo de configuración.
        query = execSync('docker exec ' + container + ' /bin/sh /etc/composer_and_pear/dependencies.sh')

    }

    executeCommand(container, type, args){

        let stdin = process.openStdin();

        let command

        if(type === 'composer'){

            command = ['exec', '-i', container, '/usr/local/bin/composer', '--working-dir=' + path.join('/', 'var', 'www', container, 'application')].concat(args.split(" "))

        }else{

            command = ['exec', '-i', container, type].concat(args.split(" "))

        }

        let query = spawn('docker', command)

        query.stdout.on('data', (data) => {

            process.stdout.write(data)

        })

        query.stderr.on('data', (err) => {

            console.log(err.toString())

        })

        query.on('exit', (code) => {

            process.stdin.destroy();
            process.exit();

        })

        stdin.addListener('data', (data) => {

            query.stdin.write(data.toString())

        })

    }

}

export default new ComposerAndPear() 
