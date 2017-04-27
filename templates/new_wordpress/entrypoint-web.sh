#!/bin/sh -l

SSL={{project.sslenable}}

function replace_domain {

    SITE_URL=$(wp option get siteurl --allow-root)

    if [ "$SSL" = "yes" ]; then

        NEW_SITE_URL=https://{{project.domain}}

    else

        NEW_SITE_URL=http://{{project.domain}}

    fi

    wp search-replace $SITE_URL $NEW_SITE_URL --allow-root

}

cp /root/templates/apache-vhost.conf /etc/apache2/sites-available/{{project.domain}}.conf &&
ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf &&

apachectl stop && apachectl start &&


cd /var/www/{{project.domain}}/application &&


echo 'init' > /var/www/{{project.domain}}/application/gorilla-status.txt &&


if [ -e ./wp-config.php ]; then

    sed -i '/DB_HOST/c\define("DB_HOST", "mysql");' wp-config.php && 
    sed -i '/DB_NAME/c\define("DB_NAME", "{{database.dbname}}");' wp-config.php &&
    sed -i '/DB_USER/c\define("DB_USER", "{{database.username}}");' wp-config.php &&
    sed -i '/DB_PASSWORD/c\define("DB_PASSWORD", "{{database.password}}");' wp-config.php

    # Si uso HTTP_HOST necesito pasarle la variable a wp-cli.
    if grep -q "HTTP_HOST" wp-config.php; then

        if ! grep -q "wp-cli.org" wp-config.php; then

            sed -i '/<?php/a if ( defined( "WP_CLI" ) && WP_CLI && ! isset( $_SERVER["HTTP_HOST"] ) ) { $_SERVER["HTTP_HOST"] = "wp-cli.org";}' wp-config.php

        fi

    fi

else

    echo 'downloading' > /var/www/{{project.domain}}/application/gorilla-status.txt &&

    wp core download --allow-root || true && 
    wp core config --dbname={{database.dbname}} --dbuser={{database.username}} --dbpass={{database.password}} --dbhost=mysql --dbprefix="${RANDOM}_" --allow-root --skip-check || true

fi


if [ "$SSL" = "yes" ]; then

    if ! grep -q "FORCE_SSL_ADMIN" wp-config.php; then

        sed -i '1s/^/<?php \nif($_SERVER["HTTP_X_FORWARDED_PROTO"] === "https") $_SERVER["HTTPS"] = "on";\ndefine("FORCE_SSL_ADMIN", true);\n?>\n /' wp-config.php

    else

        sed -i '/FORCE_SSL_ADMIN/c\define("FORCE_SSL_ADMIN", true);' wp-config.php

    fi

else

    sed -i '/FORCE_SSL_ADMIN/c\define("FORCE_SSL_ADMIN", false);' wp-config.php

fi


echo 'database' > /var/www/{{project.domain}}/application/gorilla-status.txt &&


php /root/templates/apache-checkdb.php &&
replace_domain || true &&


rm /var/www/{{project.domain}}/application/gorilla-status.txt &&


apachectl stop && sleep 1 && apachectl start -D FOREGROUND


