#!/bin/sh -l

cp /root/templates/apache-vhost.conf /etc/apache2/sites-available/{{project.domain}}.conf &&

ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf &&

# mkdir -p /var/www/{{project.domain}}/ &&
# chown -R 1000:1000 /var/www/ &&
# chmod -R g+s /var/www/ &&

usermod -u 1000 apache
groupmod -g 1000 apache 

if [ ! -e /var/www/{{project.domain}}/application/index.php ]; then

    echo '<?php echo "Hello! :-)"; ?>' > /var/www/{{project.domain}}/application/index.php

fi


apachectl start -D FOREGROUND
