var xhr, checkInterval, errorsNum, errorsLimit;

errorsLimit = 5;
errorsNum = 0;

function checkServer(){

    if(window.XDomainRequest){
        xhr = new XDomainRequest();
        xhr.onerror = requestError;
        xhr.onload = callback;
        xhr.timeout = 2000;
        xhr.open('GET', '/gorilla_status.txt');
        xhr.send();
    }else{
        xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.open('POST', '/gorilla_status.txt', true);
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


    var text = xhr.responseText.toString().trim();

    $('.message').hide();
    $('#' + text).show();

}

function requestError() {

    if(xhr.status == 404){

        clearInterval(checkInterval);
        window.open(window.location.href.split('?')[0], '_top');

    }else{

        errorsNum += 1;
        if(errorsNum >= errorsLimit){

            clearInterval(checkInterval);
            window.open(window.location.href.split('?')[0], '_top');

        }

    }


}

checkInterval = setInterval(function(){

    checkServer();

}, 2000);
