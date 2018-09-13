import { PROJECT_ENV, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'

class DjangoManager{

    constructor(){

        this.init()

    }

    init(){

        if(argv._[0] === 'django' || argv._[0] === 'manage.py' || argv._[0] === 'pip'){

            let project = new Project()
            let config = project.config[PROJECT_ENV]

            this.executeCommand(config.project.domain, argv._[0], process.argv.slice(3).join(' '))

        }

    }

    executeCommand(container, type, args){

        if(process.platform !== 'win32'){

            let pty = require('pty.js')
            let stdin = process.openStdin();
            let command

            if(type === 'django' || type === 'manage.py'){

                command = ['exec', '-it', container, 'python3', '/var/www/' + container + '/manage.py', args]

            }else{

                command = ['exec', '-it', container, 'pip3'].concat(args.split(" "))

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

        }else{

            // Si es Windows le muestro al usuario el comando que debe ejecutar porque no funciona el pseudo terminal.
            console.log('Sorry, but GorillaJS can\'t execute interactive commands in Windows automatically :-( Please, if your command need\'s to be interactive paste and run the command below in your terminal.')

            if(type === 'django' || type === 'manage.py'){

                console.log('docker exec -it ' + container + 'python3 /var/www/' + container + '/manage.py' + args)

            }else{

                console.log('docker exec -it ' + container + 'pip3' + args.split(' '))

            }

            process.exit();

        }

    }

}

export default new DjangoManager() 
