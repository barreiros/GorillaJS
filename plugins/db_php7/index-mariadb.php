<?php

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    $connection = mysqli_connect("{{project.domain}}_mysql", "{{database.username}}", "{{database.password}}", "{{database.dbname}}");

    if (mysqli_connect_errno()){

        echo "Failed to connect to MySQL: " . mysqli_connect_error();

    }else{

        echo ':-)';

    }

?>
