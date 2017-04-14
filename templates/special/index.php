<?php

    error_reporting(-1);
    ini_set('display_errors', 'On');

    // phpinfo();

    $mysql = new mysqli('mysql', '{{database.username}}', '{{database.password}}', '{{database.dbname}}'); 

    // $mongo_conn = new MongoClient('mongo:27017');
    // $mongo = $mongo_conn->selectDB('store');

?>
