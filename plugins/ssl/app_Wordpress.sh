#!/bin/sh -l

SSL={{project.sslenable}}
TEMPLATE={{docker.template_type}}

function replace_domain {

    SITE_URL=$(wp --path="/var/www/{{project.domain}}/application" option get siteurl --allow-root)

    if [ "$SSL" = "yes" ]; then

        NEW_SITE_URL=https://{{project.domain}}

    else

        NEW_SITE_URL=http://{{project.domain}}

    fi

    wp --path="/var/www/{{project.domain}}/application" search-replace $SITE_URL $NEW_SITE_URL --allow-root > /dev/null 2>&1

}

if [ "$TEMPLATE" = "Wordpress" ]; then

    # Espero a tener conexión con la base de datos.
    while !(mysqladmin -h{{project.domain}}_mysql -u{{database.username}} -p{{database.password}} ping > /var/log/mysqlconnection.txt)
    do
        sleep 1
    done

    replace_domain || true &&

    if [ "$SSL" = "yes" ]; then

        if ! grep -q "FORCE_SSL_ADMIN" /var/www/{{project.domain}}/application/wp-config.php; then

            sed -i '1s/^/<?php \nif($_SERVER["HTTP_X_FORWARDED_PROTO"] === "https") $_SERVER["HTTPS"] = "on";\ndefine("FORCE_SSL_ADMIN", true);\n?>\n /' /var/www/{{project.domain}}/application/wp-config.php

        else

            sed -i '/FORCE_SSL_ADMIN/c\define("FORCE_SSL_ADMIN", true);' /var/www/{{project.domain}}/application/wp-config.php

        fi

    else

        sed -i '/FORCE_SSL_ADMIN/c\define("FORCE_SSL_ADMIN", false);' /var/www/{{project.domain}}/application/wp-config.php

    fi

fi
