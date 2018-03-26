<?php

    function checkAttempts(){

        connect();

    }

    function connect(){

        $connection = @mysqli_connect("mysql", "{{database.username}}", "{{database.password}}", '{{database.dbname}}');
        if (mysqli_connect_errno()){

            checkAttempts();

        }else{

            exit(0);

        }

    }

    connect();

?>
