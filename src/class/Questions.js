import { prompt } from 'inquirer'
import JSPath from 'jspath'

class Questions {

    constructor(schema, config){

        this.schema = schema
        this.config = config 

    }

    process(callback){

        let unanswered = []

        // Creo una función recursiva para ir haciendo las preguntas y guardando los valores en el objeto config.
        let recursive = (base, data) => {

            // Recorro todos los nodos del objeto que recibo.
            for(let key in data){

                if(data[key].question){ // Si el objeto contiene una pregunta...

                    if(!base[key] || base[key] === ''){ // ... y no está contestada todavía, la añado al array de preguntas.

                        // Almaceno la pregunta y la referencia al objeto global porque las preguntas las tengo que hacer al final de manera asíncrona.
                        unanswered.push({
                            'base': base, 
                            'key': key,
                            'question': data[key]
                        })

                    }

                }else if(typeof data[key] === 'object'){ // Si es un objeto...

                    if(!base[key]){ // ... y no existe, lo creo.

                        if(data[key] instanceof Array){

                            base[key] = []

                        }else{

                            base[key] = {}

                        }

                    }

                    // Continúo recorriendo el objeto.
                    recursive(base[key], data[key])

                } // Si no es nada de lo anterior, lo ignoro.

            }

        }

        recursive(this.config, this.schema.schema)

        // Le muestro las preguntas al usuario.
        this.showToUser(unanswered, callback)

    }

    showToUser(questions, callback){
 
        let check = () => {

            if(questions.length){

                question(questions.shift())

            }else{

                callback(this.config)

            }

        }

        // Le muestro las preguntas al usuario de forma asíncrona. Así que creo una función que pueda volver a llamar, si es necesario, en el callback de la pregunta. 
        let question = (data) => {

            // Compruebo si la pregunta ya había sido contestada.
            if(data.base[data.key]){

                check()

                return

            }

            // Compruebo si la pregunta depende de algún otro valor.
            if(data.question.depends_on){

                let dependencies = JSPath.apply(data.question.depends_on.path, this.config)

                if(!dependencies.length){ // Si el nodo no existe en el archivo de configuración...
                    
                    if(!data.waiting){ // ... y es la primera vez que recibo esta pregunta, la devuelvo a la cola.

                        data.waiting = true
                        questions.push(data)

                    }

                    check()

                    return

                }else{ // Si el nodo existe compruebo si su valor aparece dentro de las dependencias necesarias para mostrar la pregunta.

                    if(typeof data.question.depends_on.value === 'object'){ // Si es un objeto doy por hecho que es un array.

                        if(data.question.depends_on.value.indexOf(dependencies[0]) === -1){

                            check()

                            return

                        }

                    }else{ // Si no, es una cadena.

                        if(data.question.depends_on.value !== dependencies[0]){

                            check()

                            return

                        }

                    }

                }
                
            }

            // Si llego aquí es porque he pasado todos los filtros y puedo hacer la pregunta.
            if(data.question.values && typeof data.question.values === 'object'){ // Si hay más de una opción, muestro el prompt con el selector.

                let options = []

                for(let value of data.question.values){

                    options.push(value.option)

                }

                prompt([{
                    type: 'list',
                    name: 'result',
                    message: data.question.question,
                    choices: options
                }]).then(answer => {

                    // Recupero el valor de la opción que he seleccionado en el listado.
                    let value = JSPath.apply('.values{.option === "' + answer.result + '"}', data.question)

                    data.base[data.key] = value[0].value

                    check()

                })

            }else if(data.question.question.indexOf('pass') > -1){
                    
                prompt([{
                    type: 'password',
                    name: 'result',
                    step: data.question.key,
                    message: data.question.question,
                }]).then(answer => {

                    data.base[data.key] = answer.result

                    check()

                })

            }else{

                prompt([{
                    type: 'input',
                    name: 'result',
                    step: data.question.key,
                    message: data.question.question,
                }]).then(answer => {

                    data.base[data.key] = answer.result

                    check()

                })

            }

        }

        check()

    }

}

export default Questions
