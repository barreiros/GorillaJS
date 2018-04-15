import { SOCKET_PORT } from '../const.js'
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

        // events.subscribe('TUNNEL_SEND_MESSAGE', function(id, message){
        //     
        //     io.sockets.in(id).emit('message', message)
        //
        // })

    }

    socketConnected(client){

        client.on('logging', function(id){

        })

        client.on('project', function(id){

            let roomProcess, commandArgs, commandProcess

            console.log('Se ha conectado el proyecto', id)

            client.join(id)

            client.on('message', function(message){

                if(!roomProcess){

                    console.log('Inicio el proceso', id)

                    commandArgs = message.split(' ')
                    commandProcess = commandArgs.shift() 

                    roomProcess = child.spawn(commandProcess, commandArgs, {

                        // cwd: path.join(process.cwd(), id)

                    })

                    roomProcess.stdout.on('data', function(message){
                        
                        client.emit('message', message.toString())

                    })

                    roomProcess.stderr.on('data', function(error){
                        
                        client.emit('error', error.toString())

                    })

                    roomProcess.on('exit', function(){
                        
                        client.emit('terminated')

                        roomProcess.kill()
                        roomProcess = null
                        
                    })

                }

                roomProcess.stdin.write(message + '\n');

            })

            client.on('disconnect', function(){
                
                console.log('Se ha desconectado el proyecto', id)

                // events.publish('TUNNEL_TERMINATE', [id])

            })

            client.on('error', function(error){
                
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

