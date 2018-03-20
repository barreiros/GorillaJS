var xhrServer, xhrMessages, messagesInterval, serverInterval, isStatus, serverOkTimes;

serverTimes = 0;
messagesTimes = 1; // Si quiero volver a activar los mensaje tengo que cambiar este valor a 0.
isStatus = false; // Si quiero volver a activar los mensajes tengo que eliminar este valor inicial.

history.pushState({}, null, "/");

function checkServer(){

    var checkIt;

    if(xhrServer){

        if(xhrServer.readyState === 4){

            checkIt = true;

        }

    }else{

        checkIt = true;

    }

    if(checkIt){

        console.log('Hola, Bar');

        xhrServer = $.ajax({url: '/?cache=' + (Math.random() * 10),
            type: 'HEAD',
            success: function(data, code, xhr){
                
                if(xhr.status === 200 || xhr.status === 302){

                    if(!isStatus && messagesTimes > 0){

                        serverTimes += 1;

                        if(serverTimes > 1){
                            
                            clearInterval(serverInterval);
                            clearInterval(messagesInterval);

                            window.open('/', '_top');

                        }

                    }

                }

            }

        });

    }

}

function checkMessages(){

    var checkIt;

    if(xhrMessages){

        if(xhrMessages.readyState === 4){

            checkIt = true;

        }

    }else{

        checkIt = true;

    }

    if(checkIt){

        xhrMessages = $.ajax({url: '/gorilla-status.txt?cache=' + (Math.random() * 10),
            type: 'GET',
            timeout: 5000,
            success: function(data, code, xhr){

                messagesTimes += 1;
                $('#message').text(data.toString().trim());
                isStatus = true;

            },
            error: function(error){

                messagesTimes += 1;
                isStatus = false;

            }

        });

    }

}

// messagesInterval = setInterval(function(){
//
//     checkMessages();
//
// }, 3000);

serverInterval = setInterval(function(){

    checkServer();

}, 2000);

// checkServer();
