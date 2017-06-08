#!/bin/bash

ENGINE="{{database.engine}}"
CACHE="{{cache.engine}}"
MESSAGES="{{messages.engine}}"
SSL="{{project.sslenable}}"

mkdir -p var/www/{{project.domain}}/{{project.slug}} &&
cd /var/www/{{project.domain}} &&


# Si no existe el archivo requirements.txt, añado uno por defecto.
if [ ! -e ./requirements.txt ]; then

    cp /root/templates/requirements.txt requirements.txt 

fi


echo 'Checking database' > /var/www/{{project.domain}}/{{project.slug}}/gorilla-status.txt &&

if [ "$ENGINE" == "PostgreSQL" ]; then

    apk add --no-cache postgresql-dev &&

    # Si no está el módulo de postgresql, lo añado a la lista de requirements.
    if ! grep -q "psycopg2" requirements.txt; then

        echo "psycopg2" >> requirements.txt

    fi

elif [ "$ENGINE" == "MySQL" ]; then

    apk add --no-cache mariadb-dev &&

    # Si no están lo módulos de mysql, los añado.
    if ! grep -q "MySQL-python" requirements.txt; then

        echo "MySQL-python" >> requirements.txt

    fi

    if ! grep -q "pymysql" requirements.txt; then

        echo "pymysql" >> requirements.txt

    fi

    if ! grep -q "mysqlclient" requirements.txt; then

        echo "mysqlclient" >> requirements.txt 

    fi

fi

if [ "$MESSAGES" == "yes" ]; then

    # Si no existe el módulo de Celery, lo añado.
    if ! grep -q "celery" requirements.txt; then

        echo "celery" >> requirements.txt

    fi

fi

# Instalo las dependencias.
pip install -r requirements.txt &&

# Cuando el proyecto es nuevo tengo que renombrar la carpeta de proyecto de django.
if [ -e ./djangodefault/settings.py ]; then

    mv ./djangodefault ./{{project.slug}}
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' ./{{project.slug}}/settings.py
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' ./{{project.slug}}/wsgi.py
    sed -i 's/django.default/{{project.domain}}/g; s/djangodefault/{{project.slug}}/g' ./manage.py

fi

# Si no existe el archivo manage.py, creo un nuevo proyecto.
if [ ! -e ./manage.py ]; then

    django-admin.py startproject {{project.slug}} . &&
    sed -i '/ALLOWED_HOSTS/c\ALLOWED_HOSTS = ["{{project.domain}}"]' ./{{project.slug}}/settings.py

fi

# Elimino todas las configuraciones anteriores de GorillaJS.
if [ -e {{project.slug}}/settings.py ]; then

    sed -i '/# START GORILLAJS/,/# END GORILLAJS/ d' {{project.slug}}/settings.py 

fi

# Elimino la configuración por defecto de la base de datos.
if grep -q "sqlite3" {{project.slug}}/settings.py; then

    sed -i '/^DATABASES/,/^}$/ d' {{project.slug}}/settings.py 

fi

# Añado la configuración de la base de datos a django.
if [ "$ENGINE" == "PostgreSQL" ]; then

    # Elimino los módulos de mysql
    if [ -e {{project.slug}}/settings.py ]; then

        sed -i '/MySQL-python/d' {{project.slug}}/settings.py && 
        sed -i '/pymysql/d' {{project.slug}}/settings.py && 
        sed -i '/mysqlclient/d' {{project.slug}}/settings.py

    fi
    
    echo "$(cat /root/templates/settings-postgresql)" >> {{project.slug}}/settings.py

elif [ "$ENGINE" == "MySQL" ]; then

    # Elimino el módulo de PostgreSQL
    if [ -e {{project.slug}}/settings.py ]; then

        sed -i '/psycopg2/d' {{project.slug}}/settings.py

    fi

    echo "$(cat /root/templates/settings-mysql)" >> {{project.slug}}/settings.py

else

    echo "$(cat /root/templates/settings-sqlite)" >> {{project.slug}}/settings.py

fi

# Añado la configuración del logging si no existe.
if ! grep -q "LOGGING" ./{{project.slug}}/settings.py; then

    echo "$(cat /root/templates/settings-logging)" >> {{project.slug}}/settings.py

fi

# Configuro las rutas de los estáticos que utiliza dj-static
if grep -q "STATIC_ROOT" {{project.slug}}/settings.py; then

    sed -i '/STATIC_ROOT/c\STATIC_ROOT = "staticfiles"' ./{{project.slug}}/settings.py

else
    
    echo 'STATIC_ROOT = "staticfiles"' >> ./{{project.slug}}/settings.py

fi

if grep -q "STATIC_URL" {{project.slug}}/settings.py; then

    sed -i '/STATIC_URL/c\STATIC_URL = "/static/"' ./{{project.slug}}/settings.py

else
    
    echo 'STATIC_ROOT = "staticfiles"' >> ./{{project.slug}}/settings.py

fi

if ! grep -q "MEDIA_ROOT" {{project.slug}}/settings.py; then

    echo 'MEDIA_ROOT = "media"' >> ./{{project.slug}}/settings.py

fi

if ! grep -q "MEDIA_URL" {{project.slug}}/settings.py; then

    echo 'MEDIA_URL = "/media/"' >> ./{{project.slug}}/settings.py

fi

# Reemplazo la configuración de wsgi
cp /root/templates/wsgi.py /var/www/{{project.domain}}/{{project.slug}}/wsgi.py &&

# Vacío la carpeta de logs.
rm -rf /var/log/django/* &&

rm /var/www/{{project.domain}}/{{project.slug}}/gorilla-status.txt &&

# Compilo una primera versión de los archivos estáticos
if [ ! -d "static" ]; then

    python manage.py collectstatic --noinput

fi

sleep 10 &&

# Sincronizo la base de datos.
python manage.py migrate &&

gunicorn --bind=0.0.0.0:80 {{project.slug}}.wsgi:application
