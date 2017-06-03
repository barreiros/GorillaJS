#!/bin/sh -l

# Incluyo la configuración en el proxy para poder cargar la página de Adminer.
echo "Include /etc/adminer/apache.conf" >> /etc/apache2/httpd.conf &&

# Instalo los controladores de php necesarios para manejar las bases de datos (Mysql, postgreSQL y Mongo), de momento.

apachectl graceful
