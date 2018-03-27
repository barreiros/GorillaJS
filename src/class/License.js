import { LICENSE_PATH } from '../const.js'
import { readFileSync, writeFileSync } from 'fs'
import { pathExistsSync } from 'fs-extra'

class License {

    constructor(){

        this.licenseType = 'BASIC'

    }

    check(callback){

        // Recupero el archivo de licencia.
        let license = this.license
        
        // En este punto hago unas comprobaciones básicas de formato. Sin más.
        if(license.length > 20){ 

            this.licenseType = 'PRO'

        }

        callback(this.licenseType)

    }

    add(license){

        // Guardo la licencia en el archivo de licencia.
        writeFileSync(LICENSE_PATH, license)
        
    }

    get type(){

        return this.licenseType

    }

    get license(){

        let license

        if(pathExistsSync(LICENSE_PATH)){

            license = readFileSync(LICENSE_PATH, 'utf8')

        }else{

            license = ''

        }

        return license

    }
    
}

export let license = new License()
