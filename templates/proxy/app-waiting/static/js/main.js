var xhrServer, xhrMessages, messagesInterval, serverInterval, isStatus;


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

        xhrServer = $.ajax({url: '/',
            type: 'HEAD',
            statusCode: {
                200: function (response) {

                    if(!isStatus){

                        clearInterval(serverInterval);
                        clearInterval(messagesInterval);

                        window.open('/', '_top');

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

        xhrMessages = $.ajax({url: '/gorilla_status.txt',
            type: 'GET',
            timeout: 5000,
            statusCode: {
                200: function(response){

                    $('#message').text(response.toString().trim());
                    isStatus = true;

                },
                400: function(response){

                    isStatus = false;

                },
                0: function(response){

                    isStatus = false;

                }
            }
        });

    }

}

messagesInterval = setInterval(function(){

    checkMessages();

}, 1000);

serverInterval = setInterval(function(){

    checkServer();

}, 1000);

// checkServer();
