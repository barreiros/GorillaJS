import { SYSTEM_HOSTS_FILE, DEBUG } from '../const.js'
import { readFileSync } from 'fs'
import { prompt } from 'inquirer'
import { execSync as nativeExecSync } from 'child_process'
import request from 'request'

export const addToHosts = (domain, callback) => {

    let file = readFileSync(SYSTEM_HOSTS_FILE).toString()
    let text = '127.0.0.1 ' + domain + ' #GorillaJS \n' + '127.0.0.1 www.' + domain + ' #GorillaJS';

    if(file.search(text) === -1){
    
        let options = {
            type: 'password',
            name: 'result',
            message: 'Admin system password',
        }

        let attempt = () => {

            prompt([options]).then(answer => {

                let query

                if(process.platform === 'win32'){

                    query = execSync('ECHO ' + text + ' >> ' + SYSTEM_HOSTS_FILE)

                }else{

                    query = execSync('echo "' + answer.result + '" | sudo -S sh -c "echo \'' + text + '\' >> ' + SYSTEM_HOSTS_FILE + '"')

                }

                if(query.err){

                    // Error query.err

                    attempt()

                }else{

                    callback()

                }

            })

        }

        attempt()

    }else{

        callback()

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

