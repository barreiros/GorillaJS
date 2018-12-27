# Código incrustado por el plugin DB PHP-7

ENGINE="{{database.engine_php7}}"

if [ "$ENGINE" == "postgresql" ]; then

    apk update &&
    apk add --no-cache postgresql postgresql-dev &&
    apk add php7-pgsql &&
    apk del mariadb-dev &&

    while !(pg_isready -h {{project.domain}}_postgresql -d {{database.dbname}})
    do
        sleep 1
    done

elif [ "$ENGINE" == "mysql" ]; then

    apk update &&
    apk del postgresql postgresql-dev &&
    apk del php7-pgsql &&

    while !(mysqladmin -h{{project.domain}}_mysql -u{{database.username}} -p{{database.password}} ping > /var/log/mysqlconnection.txt)
    do
       sleep 1
    done

elif [ "$ENGINE" == "mongodb" ]; then

    apk update &&
    apk add --no-cache php7-mongodb &&
    apk del postgresql postgresql-dev &&
    apk del php7-pgsql mariabdb-dev

fi

# FIN Código incrustado por el plugin DB PHP-7
