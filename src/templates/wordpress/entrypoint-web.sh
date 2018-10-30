#!/bin/sh -l

function replace_domain {

    SITE_URL=$(wp --path="/var/www/{{project.domain}}/application" option get siteurl --allow-root)
    NEW_SITE_URL=http://{{project.domain}}

    wp --path="/var/www/{{project.domain}}/application" search-replace $SITE_URL $NEW_SITE_URL --allow-root

}

cp /root/templates/apache-vhost.conf /etc/apache2/sites-available/{{project.domain}}.conf &&
ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf &&

apachectl stop && apachectl start &&

echo 'init' > /var/www/{{project.domain}}/application/gorilla-status.txt &&

if [ -e /var/www/{{project.domain}}/application/wp-config.php ]; then

    sed -i '/DB_HOST/c\define("DB_HOST", "{{project.domain}}_mysql");' /var/www/{{project.domain}}/application/wp-config.php && 
    sed -i '/DB_NAME/c\define("DB_NAME", "{{database.dbname}}");' /var/www/{{project.domain}}/application/wp-config.php &&
    sed -i '/DB_USER/c\define("DB_USER", "{{database.username}}");' /var/www/{{project.domain}}/application/wp-config.php &&
    sed -i '/DB_PASSWORD/c\define("DB_PASSWORD", "{{database.password}}");' /var/www/{{project.domain}}/application/wp-config.php

    # Si uso HTTP_HOST necesito pasarle la variable a wp-cli.
    if grep -q "HTTP_HOST" /var/www/{{project.domain}}/application/wp-config.php; then

        if ! grep -q "wp-cli.org" /var/www/{{project.domain}}/application/wp-config.php; then

            sed -i '/<?php/a if ( defined( "WP_CLI" ) && WP_CLI && ! isset( $_SERVER["HTTP_HOST"] ) ) { $_SERVER["HTTP_HOST"] = "wp-cli.org";}' /var/www/{{project.domain}}/application/wp-config.php

        fi

    fi

else

    echo 'downloading' > /var/www/{{project.domain}}/application/gorilla-status.txt &&

    wp --path="/var/www/{{project.domain}}/application/" core download --allow-root || true && 
    wp --path="/var/www/{{project.domain}}/application/" core config --dbname="{{database.dbname}}" --dbuser="{{database.username}}" --dbpass="{{database.password}}" --dbhost="{{project.domain}}_mysql" --dbprefix="${RANDOM}_" --allow-root --skip-check || true

fi

echo 'database' > /var/www/{{project.domain}}/application/gorilla-status.txt &&

while !(mysqladmin -h{{project.domain}}_mysql -u{{database.username}} -p{{database.password}} ping > /var/log/mysqlconnection.txt)
do
   sleep 1
done

replace_domain || true &&

mkdir -p /var/www/{{project.domain}}/ &&
# chown -R apache:apache /var/www/ &&
# chmod -R g+s /var/www/ &&

# su apache -s /bin/sh -c "unison /var/www/{{project.domain}}_mirror/ /var/www/{{project.domain}}/ -repeat watch -prefer newer -silent" &

rm /var/www/{{project.domain}}/application/gorilla-status.txt &&

# Inicio apache.
apachectl stop && sleep 1 && apachectl start -D FOREGROUND


