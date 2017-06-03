#!/bin/sh -l

# Compruebo si ya estaba instalado Adminer en el proxy.
if ! grep -q "/etc/adminer/apache.conf" /etc/apache2/httpd.conf; then

    # Instalo los controladores de php necesarios para manejar las bases de datos (Mysql, postgreSQL y Mongo), de momento.
    apk update &&
    apk add php7-mysqli php7-mongodb php7-pgsql php7-sqlite3 &&

    # Incluyo la configuración en el proxy para poder cargar la página de Adminer.
    echo "Include /etc/adminer/apache.conf" >> /etc/apache2/httpd.conf

    apachectl graceful

fi

