<?php

    error_reporting(-1);
    ini_set('display_errors', 'On');

    phpinfo();

    $mongo_conn = new MongoClient('mongo:27017');
    $mongo = $mongo_conn->selectDB('store');

?>
