#!/bin/sh -l

ENGINE="{{database.engine}}"

cp /root/templates/apache-vhost.conf /etc/apache2/sites-available/{{project.domain}}.conf &&

ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf || true &&

if [ "$ENGINE" == "PostgreSQL" ]; then

    apk update &&
    apk add --no-cache postgresql postgresql-dev &&
    apk add php7-pgsql &&
    apk del mariadb-dev &&

    while !(pg_isready -h {{project.domain}}_postgresql -d {{database.dbname}})
    do
        sleep 1
    done

elif [ "$ENGINE" == "MySQL" ]; then

    apk update &&
    apk del postgresql postgresql-dev &&
    apk del php7-pgsql &&

    while !(mysqladmin -h{{project.domain}}_mysql -u{{database.username}} -p{{database.password}} ping > /var/log/mysqlconnection.txt)
    do
       sleep 1
    done

elif [ "$ENGINE" == "MongoDB" ]; then

    apk update &&
    apk add --no-cache php7-mongodb &&
    apk del postgresql postgresql-dev &&
    apk del php7-pgsql mariabdb-dev

fi


if [ ! -e /var/www/{{project.domain}}/application/index.php ]; then

    cp /root/templates/index.php /var/www/{{project.domain}}/application/index.php

fi

apachectl start -D FOREGROUND
