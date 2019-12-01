import { SYSTEM_HOSTS_FILE, DEBUG } from '../const.js'
import { readFileSync } from 'fs'
import { prompt } from 'inquirer'
import { execSync as nativeExecSync } from 'child_process'
import request from 'request'

export const addToHosts = (domain, callback ) => {

    let file = readFileSync(SYSTEM_HOSTS_FILE).toString()
    let text = '127.0.0.1 ' + domain + ' #GorillaJS';

    if(file.search(text) === -1){
    
        if(process.platform === 'win32'){

            let query

            query = execSync('ECHO ' + text + ' >> ' + SYSTEM_HOSTS_FILE)
            
            // Añado el registro también con www en una llamada diferente para no tener problemas con el retorno de carro.
            text = '127.0.0.1 www.' + domain + ' #GorillaJS';
            query = execSync('ECHO ' + text + ' >> ' + SYSTEM_HOSTS_FILE)

        }else{
            
            // Añado el registro también con www en la misma llamada.
            text += '\n127.0.0.1 www.' + domain + ' #GorillaJS';

            let options = {
                type: 'password',
                name: 'result',
                message: 'Admin system password',
            }

            let attempt = () => {

                prompt([options]).then(answer => {

                    let query

                    query = execSync('echo "' + answer.result + '" | sudo -S sh -c "echo \'' + text + '\' >> ' + SYSTEM_HOSTS_FILE + '"')

                    if(query.err){

                        query = execSync('echo "' + answer.result + '" | su -s /bin/sh -c "echo \'' + text + '\' >> ' + SYSTEM_HOSTS_FILE + '"')

                    }

                    if(query.err){

                        // Error query.err

                        console.log(query)
                        attempt()

                    }else{

                        if( callback ) callback()

                    }

                })

            }

            attempt()

        }
        
    }else{

        if( callback ) callback()

    }

}

export const checkHost = (url, callback) => {

    let attempts = 0

    let attempt = () => {
        
        request(url, (error, response, body) => {

            if(!response || response.statusCode !== 200){

                attempts += 1

                if(attempts < 100){

                    setTimeout(() => {

                        attempt()

                    }, 2000)

                }else{

                    console.log('Demasiados intentos')

                    // Error demasiados intentos de conexión.

                }

            }else{

                callback()

            }

        })

    }

    attempt()

}

export const execSync = (query, options = {}) => {

    let output

    try{

        let response = nativeExecSync(query, options)

        output = {

            stdout: response.toString(),
            stderr: false,
            err: false

        }

    }catch(err){

        output = {

            stdout: err.stdout ? err.stdout.toString() : '',
            stderr: err.stderr ? err.stderr.toString() : '',
            err: err.stderr ? err.stderr.toString() : ''

        }

    }

    if(DEBUG){

        console.log(output)

    }

    return output

}

