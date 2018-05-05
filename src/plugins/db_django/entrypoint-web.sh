#!/bin/bash

ENGINE="{{database.engine}}"

mkdir -p var/www/{{project.domain}}/{{project.slug}} &&
cd /var/www/{{project.domain}} &&

# Si no existe el archivo requirements.txt, añado uno por defecto.
if [ ! -e /var/www/{{project.domain}}/requirements.txt ]; then

    cp /root/templates/requirements.txt /var/www/{{project.domain}}/requirements.txt 

fi

if [ "$ENGINE" == "PostgreSQL" ]; then

    apk add --no-cache postgresql postgresql-dev postgresql-client &&
    apk del mariadb-dev &&

    # Si no está el módulo de postgresql, lo añado a la lista de requirements.
    if ! grep -q "psycopg2" /var/www/{{project.domain}}/requirements.txt; then

        echo "psycopg2" >> /var/www/{{project.domain}}/requirements.txt

    fi

    while !(pg_isready -h {{project.domain}}_postgresql -d {{database.dbname}})
    do
        sleep 1
    done

elif [ "$ENGINE" == "MySQL" ]; then

    apk add --no-cache mariadb-dev &&
    apk del postgresql postgresql-dev postgresql-client &&

    # Si no están lo módulos de mysql, los añado.
    if ! grep -q "MySQL-python" /var/www/{{project.domain}}/requirements.txt; then

        echo "MySQL-python" >> /var/www/{{project.domain}}/requirements.txt

    fi

    if ! grep -q "pymysql" /var/www/{{project.domain}}/requirements.txt; then

        echo "pymysql" >> /var/www/{{project.domain}}/requirements.txt

    fi

    if ! grep -q "mysqlclient" /var/www/{{project.domain}}/requirements.txt; then

        echo "mysqlclient" >> /var/www/{{project.domain}}/requirements.txt 

    fi

    # while !(mysqladmin -h{{project.domain}}_mysql -u{{database.username}} -p{{database.password}} ping > /var/log/mysqlconnection.txt)
    # do
    #    sleep 1
    # done

fi


if [ "$MESSAGES" == "yes" ]; then

    # Si no existe el módulo de Celery, lo añado.
    if ! grep -q "celery" /var/www/{{project.domain}}/requirements.txt; then

        echo "celery" >> /var/www/{{project.domain}}/requirements.txt

    fi

fi

# Instalo los paquetes básicos.
pip3 install gunicorn dj-static &&

# Instalo las dependencias.
pip3 install -r /var/www/{{project.domain}}/requirements.txt &&

# Cuando el proyecto es nuevo tengo que renombrar la carpeta de proyecto de django.
if [ -e /var/www/{{project.domain}}/djangodefault/settings.py ]; then

    mv /var/www/{{project.domain}}/djangodefault/* /var/www/{{project.domain}}/{{project.slug}} &&
    rm -rf /var/www/{{project.domain}}/djangodefault &&
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' /var/www/{{project.domain}}/{{project.slug}}/settings.py &&
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' /var/www/{{project.domain}}/{{project.slug}}/wsgi.py &&
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' /var/www/{{project.domain}}/manage.py 

fi

# Si no existe el archivo manage.py, creo un nuevo proyecto.
if [ ! -e /var/www/{{project.domain}}/manage.py ]; then

    cd /var/www/{{project.domain}} &&
    django-admin.py startproject {{project.slug}} . &&
    sed -i '/ALLOWED_HOSTS/c\ALLOWED_HOSTS = ["{{project.domain}}"]' /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

# Elimino todas las configuraciones anteriores de GorillaJS.
if [ -e /var/www/{{project.domain}}/{{project.slug}}/settings.py ]; then

    sed -i '/# START GORILLAJS/,/# END GORILLAJS/ d' /var/www/{{project.domain}}/{{project.slug}}/settings.py 

fi

# Elimino la configuración por defecto de la base de datos.
if grep -q "sqlite3" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    sed -i '/^DATABASES/,/^}$/ d' /var/www/{{project.domain}}/{{project.slug}}/settings.py 

fi

# Añado la configuración de la base de datos a django.
if [ "$ENGINE" == "PostgreSQL" ]; then

    # Elimino los módulos de mysql
    if [ -e /var/www/{{project.domain}}/{{project.slug}}/settings.py ]; then

        sed -i '/MySQL-python/d' /var/www/{{project.domain}}/{{project.slug}}/settings.py && 
        sed -i '/pymysql/d' /var/www/{{project.domain}}/{{project.slug}}/settings.py && 
        sed -i '/mysqlclient/d' /var/www/{{project.domain}}/{{project.slug}}/settings.py

    fi
    
    echo "$(cat /root/templates/settings-postgresql)" >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

elif [ "$ENGINE" == "MySQL" ]; then

    # Elimino el módulo de PostgreSQL
    if [ -e /var/www/{{project.domain}}/{{project.slug}}/settings.py ]; then

        sed -i '/psycopg2/d' /var/www/{{project.domain}}/{{project.slug}}/settings.py

    fi

    echo "$(cat /root/templates/settings-mysql)" >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

else

    echo "$(cat /root/templates/settings-sqlite)" >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

# Añado la configuración del logging si no existe.
if ! grep -q "LOGGING" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    echo "$(cat /root/templates/settings-logging)" >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

# Configuro las rutas de los estáticos que utiliza dj-static
if grep -q "STATIC_ROOT" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    sed -i '/STATIC_ROOT/c\STATIC_ROOT = "staticfiles"' /var/www/{{project.domain}}/{{project.slug}}/settings.py

else
    
    echo 'STATIC_ROOT = "staticfiles"' >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

if grep -q "STATIC_URL" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    sed -i '/STATIC_URL/c\STATIC_URL = "/static/"' /var/www/{{project.domain}}/{{project.slug}}/settings.py

else
    
    echo 'STATIC_ROOT = "staticfiles"' >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

if ! grep -q "MEDIA_ROOT" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    echo 'MEDIA_ROOT = "media"' >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

if ! grep -q "MEDIA_URL" /var/www/{{project.domain}}/{{project.slug}}/settings.py; then

    echo 'MEDIA_URL = "/media/"' >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

fi

# Reemplazo la configuración de wsgi
cp /root/templates/wsgi.py /var/www/{{project.domain}}/{{project.slug}}/wsgi.py &&

# Vacío la carpeta de logs.
rm -rf /var/log/django/* &&

# Compilo una primera versión de los archivos estáticos
if [ ! -d "static" ]; then

    python3 /var/www/{{project.domain}}/manage.py collectstatic --noinput

fi

# Sincronizo la base de datos.
python3 /var/www/{{project.domain}}/manage.py migrate &&

cd /var/www/{{project.domain}} &&
gunicorn --bind=0.0.0.0:80 {{project.slug}}.wsgi:application
