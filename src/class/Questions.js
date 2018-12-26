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

                filter(questions.shift())

            }else{

                callback(this.config)

            }

        }

        // Le muestro las preguntas al usuario de forma asíncrona. Así que creo una función que pueda volver a llamar, si es necesario, en el callback de la pregunta. 
        let filter = (data) => {

            // Compruego las dependencias de las preguntas para ver cuál hay que mostrar primero o cuál no hay que mostrar.
            if(data.question.depends_on){

                if(data.question.depends_on instanceof Array === false){

                    data.question.depends_on = [data.question.depends_on]

                }

                let showed = false
                let preserveNodes = [] // Creo un listado con los nodos que todavía no existen.

                for(let dependency of data.question.depends_on){

                    let dependencies = JSPath.apply(dependency.path, this.config)

                    if(dependencies.length){ // Si el nodo existe en el archivo de configuración compruebo si coincide el filtro.

                        if(typeof dependency.value === 'object'){ // Si es un objeto doy por hecho que es un array.

                            if(dependency.value.indexOf(dependencies[0]) !== -1){

                                showed = true

                                break

                            }

                        }else{ // Si no, es una cadena.

                            if(dependency.value === dependencies[0]){

                                showed = true

                                break

                            }

                        }

                    }else{ // Si no existe salgo del bucle para poder aprovecharlo.

                        preserveNodes.push(dependency)

                    }

                }

                if(showed){ // Si la pregunta no puede ser respondida en este momento la devuelvo a la lista.

                    show(data)

                }else{

                    if(preserveNodes.length > 0){

                        data.question.depends_on = preserveNodes
                        questions.push(data)

                    }

                    check()

                }

            } else { // Si no hay filtros, muestro la pregunta directamente.

                show(data)

            }

        }

        let show = (data) => {

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
