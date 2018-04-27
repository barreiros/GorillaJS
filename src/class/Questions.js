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

                if(data.question.depends_on instanceof Array === false){

                    data.question.depends_on = [data.question.depends_on]

                }

                let ignore

                for(let dependency of data.question.depends_on){

                    let dependencies = JSPath.apply(dependency.path, this.config)

                    if(!dependencies.length && !data.waiting){ // Si el nodo no existe en el archivo de configuración...

                        data.waiting = true
                        questions.push(data)

                        ignore = true

                    }else{ // Si el nodo existe compruebo si su valor aparece dentro de las dependencias necesarias para mostrar la pregunta.

                        if(typeof dependency.value === 'object'){ // Si es un objeto doy por hecho que es un array.

                            if(dependency.value.indexOf(dependencies[0]) !== -1){

                                ignore = false

                                break

                            }else{

                                ignore = true


                            }

                        }else{ // Si no, es una cadena.

                            if(dependency.value !== dependencies[0]){

                                ignore = true

                            }else{

                                ignore = false

                                break

                            }

                        }

                    }

                }
                
                if(ignore){

                    check()

                    return

                }

            }

            // Si llego aquí es porque he pasado todos los filtros y puedo hacer la pregunta.
            if(data.question.values && typeof data.question.values === 'object'){ // Si hay más de una opción, muestro el prompt con el selector.

                let list = []

                for(let value of data.question.values){

                    if(list.indexOf(value.option) === -1){

                        list.push(value.option)

                    }

                }

                let options = {
                    type: 'list',
                    name: 'result',
                    message: data.question.question,
                    choices: list
                }

                if(data.question.default){
                    
                    options.default = data.question.default

                }

                prompt([options]).then(answer => {

                    // Recupero el valor de la opción que he seleccionado en el listado.
                    let value = JSPath.apply('.values{.option === "' + answer.result + '"}', data.question)

                    data.base[data.key] = value[0].value

                    check()

                })

            }else if(data.question.question.indexOf('pass') > -1){
                    
                let options = {
                    type: 'password',
                    name: 'result',
                    step: data.question.key,
                    message: data.question.question,
                }

                if(data.question.default){
                    
                    options.default = data.question.default

                }

                prompt([options]).then(answer => {

                    data.base[data.key] = answer.result

                    check()

                })

            }else{

                let options = {
                    type: 'input',
                    name: 'result',
                    step: data.question.key,
                    message: data.question.question,
                }

                if(data.question.default){
                    
                    options.default = data.question.default

                }

                prompt([options]).then(answer => {

                    data.base[data.key] = answer.result

                    check()

                })

            }

        }

        check()

    }

}

export default Questions
