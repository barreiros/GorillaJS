import { PROJECT_ENV } from '../../const.js'
import Project from '../../class/Project.js'
import { argv } from 'yargs'
import { execSync } from '../../class/Tools.js'
import { pathExistsSync, ensureFileSync } from 'fs-extra'
import JSPath from 'jspath'
import path from 'path'

class DBManager{

    constructor(){

        this.init()

    }

    init(){

        if(argv._[0] === 'db'){

            if(argv._[1] === 'import'){

                if(pathExistsSync(argv._[2])){

                    this.import(argv._[2])

                }else{

                    // Error archivo no existe.

                }

            }else if(argv._[1] === 'replace'){

                if(pathExistsSync(argv._[2])){

                    this.replace(argv._[2])

                }else{

                    // Error archivo no existe.
                    
                }

            }else if(argv._[1] === 'export'){

                ensureFileSync(argv._[2])
                this.export(argv._[2])

            }else if(argv._[1] === 'extra'){

                this.extra( argv._[2] );

            }else if(argv._[1] === 'show'){

                this.show( );

            }

        }else if(argv._[1] === 'clone'){

            // Routemap

        }

    }

    extra( name ) {

        let project = new Project()
        let config = project.config[PROJECT_ENV]


        // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
        let engine = JSPath.apply('..config.ase.engine', config)

        if(engine.indexOf('mysql'.toLowerCase())){

            let command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "CREATE DATABASE ' + name + '" '

            let query = execSync(command)

            if(!query.err){

                console.log( 'Done! Extra database created' );

            }

        }

    }

    show( ) {

        let project = new Project()
        let config = project.config[PROJECT_ENV]


        // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
        let engine = JSPath.apply('..config.ase.engine', config)

        if(engine.indexOf('mysql'.toLowerCase())){

            let command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "SHOW DATABASES" '

            let query = execSync(command)

            if(!query.err){

                console.log( query.stdout );

            }

        }

    }

    import(source){

        let project = new Project()
        let config = project.config[PROJECT_ENV]

        // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
        let engine = JSPath.apply('..config.ase.engine', config)

        if(engine.indexOf('mysql'.toLowerCase())){

            // Step iniciando el proceso de importación.

            let command = 'docker exec -i ' + config.project.domain + '_mysql mysql --force -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' < "' + source + '"'

            let query = execSync(command)

            if(!query.err){

                // Step importación correcta.

            }

        }

    }

    export(target){

        let project = new Project()
        let config = project.config[PROJECT_ENV]

        // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
        let engine = JSPath.apply('..config.ase.engine', config)

        if(engine.indexOf('mysql'.toLowerCase())){

            // Step iniciando el proceso de importación.

            let command = 'docker exec -i ' + config.project.domain + '_mysql mysqldump -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' > ' + target

            let query = execSync(command)

            if(!query.err){

                // Step exportación correcta.

            }

        }

    }

    replace(source){

        let project = new Project()
        let config = project.config[PROJECT_ENV]

        // Como de momento solo es compatible con MySQL, busco el valor en el archivo de configuracion.
        let engine = JSPath.apply('..config.ase.engine', config)

        if(engine.indexOf('mysql'.toLowerCase())){

            // Step iniciando el proceso de reemplazo

            let command = ''

            command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "DROP DATABASE ' + config.database.dbname + '" '

            let query = execSync(command)

            if(!query.err){

                command = 'docker exec -i ' + config.project.domain + '_mysql mysql -u' + config.database.username + ' -p' + config.database.password + ' -e "CREATE DATABASE ' + config.database.dbname + '"'
                
                query = execSync(command)

                if(!query.err){

                    command = 'docker exec -i ' + config.project.domain + '_mysql mysql --force -u' + config.database.username + ' -p' + config.database.password + ' ' + config.database.dbname + ' < "' + source + '"'

                    query = execSync(command)

                    if(!query.err){

                        // Step proceso de reemplazo correcto.
                        
                    }

                }

            }

        }

    }

}

export default new DBManager() 
