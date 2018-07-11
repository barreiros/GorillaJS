import { PROJECT_ENV, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'
import { spawn } from 'child_process'
import { execSync } from '../../class/Tools.js'

class ExtraPackages{

    constructor(){

        this.init()

    }

    init(){

        if(argv._[0] === 'apk' || argv._[0].search('apt') !== -1 || argv._[0] === 'pacman' || argv._[0] === 'rpm' || argv._[0] === 'yum'){

            let project = new Project()
            let config = project.config[PROJECT_ENV]
            let container

            if(argv.c){
                
                container = argv.c

            }else{

                container = config.project.domain
            }

            this.executeCommand(container, argv._[0], process.argv.slice(3).join(' '))

        }

    }

    executeCommand(container, type, args){
        
        if(process.platform !== 'win32'){

            let pty = require('pty.js')
            let stdin = process.openStdin();
            let command = ['exec', '-i', container, type].concat(args.split(" "))
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

        }else{

            // Si es Windows le muestro al usuario el comando que debe ejecutar porque no funciona el pseudo terminal.
            console.log('Sorry, but GorillaJS can\'t execute interactive commands in Windows automatically :-( Please, if your command need\'s to be interactive paste and run the command below in your terminal.')
            console.log('docker exec -i ' + container + ' ' + type + ' ' + args.split(" "))
        
            let query = execSync('docker exec -i ' + container + ' ' + type + ' ' + args.split(" "))

            console.log(query.stdout)

            process.exit();

        }

    }

}

export default new ExtraPackages() 
