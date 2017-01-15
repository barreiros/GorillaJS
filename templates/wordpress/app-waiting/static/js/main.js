var xhr, checkInterval;

function checkServer(){

    if(window.XDomainRequest){
        xhr = new XDomainRequest();
        xhr.onerror = requestError;
        xhr.onload = callback;
        xhr.timeout = 2000;
        xhr.open('GET', window.location.href + '/gorilla_status.txt');
        xhr.send();
    }else{
        xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.open('POST', window.location.href + '/gorilla_status.txt', true);
        xhr.onload = function() {
            if (xhr.readyState > 3 && xhr.status === 200) {
                callback();
            }else if(!xhr.responseText.length){
                // OPTIONS Method
            }else{
                requestError();
            }
        };
        xhr.timeout = 2000;
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send();
    }
}

function callback() {

    console.log(xhr.responseText);
    if(xhr.responseText === 'init'){

    }else if(xhr.responseText === 'downloading'){

    }else if(xhr.responseText === 'ssl'){

    }else if(xhr.responseText === 'database'){

    }

}

function requestError() {

    if(xhr.status == 404){

        clearInterval(checkInterval);
        window.open(window.location.href, '_top');

    }

}

checkInterval = setInterval(function(){

    checkServer();

}, 3000);