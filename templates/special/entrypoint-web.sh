#!/bin/sh -l

cp /root/templates/apache-httpd.conf /etc/apache2/httpd.conf &&
cp /root/templates/apache-vhost.conf /etc/apache2/sites-available/{{project.domain}}.conf &&

ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf &&

# apachectl start &&
#
# echo 'init' > /var/www/localhost/gorilla_status.txt &&

apachectl start -D FOREGROUND


