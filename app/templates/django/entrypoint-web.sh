#!/bin/bash

mkdir -p var/www/{{project.domain}}/{{project.slug}} &&
cd /var/www/{{project.domain}} &&


# Si no existe el archivo requirements.txt, añado uno por defecto.
if [ ! -e /var/www/{{project.domain}}/requirements.txt ]; then

    cp /root/templates/requirements.txt /var/www/{{project.domain}}/requirements.txt 

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

echo "$(cat /root/templates/settings-sqlite)" >> /var/www/{{project.domain}}/{{project.slug}}/settings.py

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
