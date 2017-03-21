#!/bin/sh -l

cp /root/templates/apache-httpd.conf /etc/apache2/httpd.conf
cp /root/templates/index.php /var/www/localhost/htdocs/index.php

apachectl start -D FOREGROUND


