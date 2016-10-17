<?php

    $mysqli = new mysqli("mysql", "{{database.username}}", "{{database.password}}", '{{database.dbname}}');; 
    while(!@$mysqli->ping()){}

?>
