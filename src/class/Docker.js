import { PROJECT_PATH, PROJECT_ENV } from '../const.js'
import { execSync, spawnSync } from 'child_process'
import path from 'path'

class Docker{

    constructor(){

    }

    check(){

        let query

        // Compruebo si docker está instalado y funcionando.
        query = spawnSync('docker', ['ps'])

        if(query.error || query.stderr.toString()){

            // Debug query.error

            return false

        }

        // Compruebo si docker está instalado y funcionando.
        query = spawnSync('docker-compose', ['-v'])

        if(query.error || query.stderr.toString()){

            // Debug query.error

            return false

        }

        return true

    }

    start(composeFile, slug, force = true){

        let command

        if(force){

            command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up --force-recreate -d'

        }else{

            command = 'docker-compose -f "' + composeFile + '" -p "' + slug + '" up -d'

        }

        try{

            execSync(command)

        }catch(err){

            // Debug err.stderr.toString()

            console.log(err.stderr.toString())

        }

    }

    stop(composeFile, slug){

        let command 

        command = 'docker-compose -p "' + slug + '" rm -f -s -v'

        try{

            execSync(command, {
                cwd: path.dirname(composeFile)
            })

        }catch(err){

            // Debug err.stderr.toString()

            console.log(err.stderr.toString())

        }

    }

    // network: function(){
    //
    //     var container; 
    //
    //     cross.exec('docker network ls --format="{{.Name}}"', function(err, stdout, stderr){
    //
    //         if (err) events.publish('ERROR', ['035']);
    //
    //         containers = getContainersName(stdout);
    //
    //         if(containers.indexOf('gorillajs') === -1){
    //
    //             cross.exec('docker network create --driver bridge gorillajs', function(err, stdout, stderr){
    //
    //                 events.publish('VERBOSE', [stderr + err + stdout]);
    //                 events.publish('PROMISEME');
    //
    //             });
    //
    //         }else{
    //
    //             events.publish('PROMISEME');
    //
    //         }
    //
    //     });
    //
    // }

}

export default Docker
