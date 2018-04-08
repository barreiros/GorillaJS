import { PROJECT_ENV, FORCE } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'
import { spawn } from 'child_process'
import path from 'path'

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

    }

}

export default new ExtraPackages() 
