#!/bin/bash 

cp /root/templates/apache-proxy.conf /etc/apache2/sites-available/test.com.conf &&
rm -rf /var/www/localhost &&
cp -r /root/templates/app-waiting /var/www/localhost &&

## Configuración del firewall
cat /root/templates/evasive >> /etc/apache2/httpd.conf &&
mkdir -p /var/log/mod_evasive && 

ln -sf /etc/apache2/sites-available/test.com.conf /etc/apache2/sites-enabled/test.com.conf || true &&

# Reinicio apache y lo ejecuto en primer plano.
apachectl stop && apachectl start -D FOREGROUND
