import { PROJECT_ENV, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'
import pty from 'pty.js'

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

    }

}

export default new DjangoManager() 
