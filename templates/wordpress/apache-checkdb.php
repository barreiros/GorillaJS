<?php

    $attempts = 5;

    function checkAttempts(){

        global $attempts;

        if($attempts > 0){

            connect();

        }else{

            exit(0);

        }
    }

    function connect(){

        global $attempts;
        
        $connection = @mysqli_connect("mysql", "{{database.username}}", "{{database.password}}", '{{database.dbname}}');
        if (mysqli_connect_errno()){

            $attempts -= 1;
            checkAttempts();

        }else{

            exit(0);

        }

    }

    connect();

?>
