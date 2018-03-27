import License from './License.js'

class IAM{

    constructor(){

    }

    credentials(){

        // Recupero la licencia
        let license = new License()
        console.log(license.license)

        // Hago una llamada a GorillaJS para conseguir las claves de Amazon que me permitirán acceder a los recursos del usuario de manera temporal.
        // request...

        // Si la llamada devuelve error, se lo muestro al usuario y delego en quien haya hecho la llamada parar o no el programa.

    }

}

export default IAM
