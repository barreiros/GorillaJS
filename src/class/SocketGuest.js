import { SOCKET_PORT, GUEST_GORILLAJS_PATH } from '../const.js'
import http from 'http'
import socketio from 'socket.io'
import * as child from 'child_process'
import path from 'path'

class SocketGuest {

    constructor(){

        let app, io

        app = http.createServer()

        app.listen(SOCKET_PORT)

        io = socketio(app)

        io.on('connection', this.socketConnected) 

        io.on('error', this.socketError) 

    }

    socketConnected(client){

        console.log('Se conecta un nuevo cliente')

        let query

        client.on('command', (params) => {

            if(params.type === 'persistent'){

                let commandArgs, commandProcess

                commandArgs = params.command.split(' ')
                commandProcess = commandArgs.shift() 

                query = child.spawn(commandProcess, commandArgs)

                query.stdout.on('data', (message) => {
                    
                    client.emit('message', {type: 'data', 'message': message.toString()})

                })

                query.stderr.on('data', (error) => {
                    
                    client.emit('message', {type: 'error', 'message': error.toString()})

                })

                query.on('exit', () => {
                    
                    client.emit('message', {type: 'exit', 'message': ''})

                    query.kill()
                    query = null
                    
                })

            }else{

                child.exec(params.command, (err, stdout, stderr) => {

                    if(err){

                        client.emit('message', {type: 'error', message: stderr.toString()})

                    }else{

                        client.emit('message', {type: 'ok', message: stdout.toString()})

                    }

                })

            }

        })

        client.on('message', (message) => {

            query.stdin.write(message + '\n');

        })

        client.on('disconnect', () => {
            
            console.log('Se ha desconectado el proyecto', id)

        })

        client.on('error', (error) => {
            
            console.log('Error en el proyecto', id, error.toString())

        }) 

    }

    socketError(error){

        console.log(erro)

    }

}

export default SocketGuest 

