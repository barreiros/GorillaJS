<?php

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    $connection = pg_connect("host={{project.domain}}_postgresql dbname={{database.dbname}} user={{database.username}} password={{database.password}}");

    echo ':-)';

?>
