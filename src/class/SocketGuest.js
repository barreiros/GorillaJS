import { SOCKET_PORT, GUEST_GORILLAJS_PATH } from '../const.js'
import http from 'http'
import socketio from 'socket.io'
import * as child from 'child_process'
import path from 'path'

class SocketGuest {

    constructor(){

        console.log('Inicio el socket del Guest')

        let app, io

        app = http.createServer()

        app.listen(SOCKET_PORT)

        io = socketio(app)

        io.on('connection', this.socketConnected) 

        io.on('error', this.socketError) 

        // events.subscribe('TUNNEL_SEND_MESSAGE', function(id, message){
        //     
        //     io.sockets.in(id).emit('message', message)
        //
        // })

    }

    socketConnected(client){

        console.log('Se conecta un nuevo cliente')

        client.on('global', (command) => {

            child.exec(command, (err, stdout, stderr) => {

                if(err){

                    client.emit('message', {status: 'error', message: stderr.toString()})

                }else{

                    client.emit('message', {status: 'ok', message: stdout.toString()})

                }

            })

            client.emit('connect', 'Conectado!!!')

        })

        client.on('logging', (id) => {

        })

        client.on('project', (id) => {

            let roomProcess, commandArgs, commandProcess

            console.log('Se ha conectado el proyecto', id)

            client.join(id)

            client.on('message', (message) => {

                if(!roomProcess){

                    console.log('Inicio el proceso', id)

                    commandArgs = message.split(' ')
                    commandProcess = commandArgs.shift() 

                    roomProcess = child.spawn(commandProcess, commandArgs, {

                        cwd: path.join(GUEST_GORILLAJS_PATH, id)

                    })

                    roomProcess.stdout.on('data', (message) => {
                        
                        client.emit('message', message.toString())

                    })

                    roomProcess.stderr.on('data', (error) => {
                        
                        client.emit('error', error.toString())

                    })

                    roomProcess.on('exit', () => {
                        
                        client.emit('terminated')

                        roomProcess.kill()
                        roomProcess = null
                        
                    })

                }

                roomProcess.stdin.write(message + '\n');

            })

            client.on('disconnect', () => {
                
                console.log('Se ha desconectado el proyecto', id)

                // events.publish('TUNNEL_TERMINATE', [id])

            })

            client.on('error', (error) => {
                
                console.log('Error en el proyecto', id, error.toString())

                // events.publish('TUNNEL_ERROR', [id, error.toString()])

            }) 

        })

    }

    socketError(error){

        console.log(erro)

    }

}

export default SocketGuest 

