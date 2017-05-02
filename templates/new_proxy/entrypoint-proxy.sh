#!/bin/bash 

# docker-compose -f /Users/barreiros/Library/gorillajs/proxy/template/docker-compose.yml -p "gorillajs" logs

cp /root/templates/apache-proxy.conf /etc/apache2/sites-available/{{project.domain}}.conf &&
rm -rf /var/www/localhost &&
cp -r /root/templates/app-waiting /var/www/localhost &&

## Configuración del firewall
cat /root/templates/evasive >> /etc/apache2/httpd.conf &&
mkdir /var/log/mod_evasive && 

# a2enmod evasive proxy proxy_http proxy_wstunnel ssl headers mcrypt &&

ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf || true &&

# Reinicio apache y lo ejecuto en primer plano.
apachectl stop && apachectl start -D FOREGROUND
