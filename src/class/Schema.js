import { PROJECT_PATH, SCHEMA_PATH, PROJECT_TEMPLATES_OFFICIAL, PROJECT_TEMPLATES_CUSTOM, PROJECT_PLUGINS_OFFICIAL, PROJECT_PLUGINS_CUSTOM} from '../const.js'
import { pathExistsSync, ensureFileSync } from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'
import glob from 'glob'

class Schema{

    constructor(force = false){

        this.force = force

    }

    get list(){

        if(!pathExistsSync(SCHEMA_PATH) || this.force){ // Si no existe el archivo, o está forzada la creación, lo genero.

            return this.process()

        }else{

            return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))

        }

    }

    process(){

        // Busco todos los archivos config.json de las carpetas de templates y plugins oficiales y personalizados.
        let files = '{' + PROJECT_TEMPLATES_OFFICIAL + ',' + PROJECT_TEMPLATES_CUSTOM + ',' + PROJECT_PLUGINS_OFFICIAL + ',' + PROJECT_PLUGINS_CUSTOM + '}/**/config.json'
        let output;

        for(let file of glob.sync(files)){

            let json = JSON.parse(readFileSync(file, 'utf8'))

            if(json.schema){

                if(!output){

                    output = {
                        "schema": json.schema
                    }

                }else{

                    // Creo una función recursiva para ir añadiendo los campos y así fusionar los json.
                    let recursive = (base, data) => {

                        // Recorro todos los nodos del objeto que recibo.
                        for(let key in data){

                            if(key === 'path' || key === 'value' || key === 'values' || key === 'depends_on'){ // Estos son objetos de los que estoy seguro que son de último nivel y los trato de forma especial para evitar conflictos.
                                
                                if(!base[key]){ // Si no existe en la base, añado directamente el valor que viene.

                                    base[key] = data[key]

                                }else{

                                    if(typeof base[key] === 'string'){ // Si en la base ya existe y es un string, convierto ese valor en un array con ese mismo valor para fusionarlo.

                                        if(data[key] instanceof Array){ // Si el valor que viene es un array, los fusiono.

                                            data[key].push(base[key])
                                            base[key] = data[key] 

                                        }else{ // Si no, doy por hecho que es un string.

                                            base[key] = [base[key], data[key]]

                                        }

                                    }else if(base[key] instanceof Array){ // Si el valor de la base es un array.

                                        if(data[key] instanceof Array){ // Si el valor que viene es un array, los fusiono.

                                            base[key] = base[key].concat(data[key])

                                        }else{ // Si no, doy por hecho que es un string.

                                            base[key].push(data[key])

                                        }

                                    }else{ // Si no, el valor de la base es un objeto.

                                        if(data[key] instanceof Array){ // Si el valor que viene es un array, los fusiono.

                                            data[key].push(base[key])
                                            base[key] = data[key]

                                        }else{

                                            base[key] = [base[key], data[key]]

                                        }

                                    }

                                    if(base[key] instanceof Array){ // Si al final obtengo un array, elimino los posibles resultados duplicados.

                                        let unique = new Set(base[key])
                                        base[key] = Array.from(unique)

                                    }

                                }

                            }else{

                                if(data[key] instanceof Array && typeof data[key][0] === 'string'){ // Si es un array de cadenas...

                                    if(!base[key]){ // ... y no existe el campo destino, creo el campo y le asigno el valor del array.

                                        base[key] = []

                                    }else if(base[key] && base[key] instanceof Array){ // ... existe el campo destino y es un array, los fusiono. 

                                        base[key] = base[key].concat(data[key])

                                    }else{ // ... existe el campo destino y es una cadena, concateno los dos valores en un array.

                                        if(!data[key].includes(base[key])){ // Solo si el valor no existe ya en el array.

                                            base[key] = [base[key], data[key]]

                                        }

                                    }

                                    base[key].push(data[key])

                                }else if(data[key] instanceof Array && typeof data[key][0] === 'object'){ // Si es un array de objetos

                                    if(!base[key]){ // .. y no existe el campo destino, lo creo y vuelvo a ejecutar el proceso.

                                        base[key] = []

                                        recursive(base[key], data[key])

                                    }else if(base[key] && base[key] instanceof Array){ 

                                        base[key] = base[key].concat(data[key])

                                    }else if(base[key] && typeof base[key] === 'object'){

                                        data[key].push(base[key])
                                        base[key] = data[key]

                                    }

                                }else if(typeof data[key] === 'object'){

                                    if(!base[key]){

                                        base[key] = {}

                                    }

                                    recursive(base[key], data[key])

                                }else{ // Doy por hecho que el valor que viene es una cadena.

                                    if(!base[key]){ // Si el campo de destin no existe, le asigno el valor.

                                        base[key] = data[key]

                                    }else if(base[key] && typeof data[key] === 'string'){ // Si el campo de destino existe y tiene una cadena, los uno en un array.

                                        if(base[key].toString() !== data[key].toString()){ // Solo si son distintas.

                                            base[key] = [base[key], data[key]]

                                        }

                                    }else{ // Si el campo de destino existe y es un array, añado el valor al array.

                                        base[key].push(data[key])

                                    }

                                }

                            }

                        }
                        
                    }

                    recursive(output.schema, json.schema)

                }

            }

        }

        ensureFileSync(SCHEMA_PATH)
        writeFileSync(SCHEMA_PATH, JSON.stringify(output, null, '\t'))

        return output

    }

}

export default Schema
