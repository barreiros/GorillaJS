#!/bin/sh -l

echo "Include /etc/adminer/apache.conf" >> /etc/apache2/httpd.conf &&

# Copio los módulos de php en el directorio "php-config --extension-dir"

apachectl graceful
