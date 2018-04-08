<?php

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    $manager = new MongoDB\Driver\Manager("mongodb://{{database.username}}:{{database.password}}@test2.local_mongo/{{database.dbname}}");

    echo ':-)';


?>
