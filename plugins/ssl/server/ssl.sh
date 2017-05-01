#!/bin/sh -l

SSL={{project.sslenable}}
LOCAL={{project.islocal}}

echo "Include /root/templates/apache-ssl.conf" >> /etc/apache2/httpd.conf &&

## Instalo las dependencias
if ! apk info | grep "apache2-ssl"; then

    apk update && apk add apache2-ssl

fi


## Configuración de SSL
if [ "$SSL" = "yes" -a "$LOCAL" = "no" ]; then

    # Para activar el certificado tengo que asegurarme de tener activo el dominio principal.
    HOME=/etc/letsencrypt && cd /acme.sh && ./acme.sh --install && 

    cp /root/templates/apache-proxy-ssl.conf /etc/apache2/sites-available/{{project.domain}}-ssl.conf &&
    mkdir -p /etc/letsencrypt/verify/{{project.domain}} && 
    /etc/letsencrypt/.acme.sh/acme.sh --issue --debug -d {{project.domain}} -d www.{{project.domain}} --accountemail {{project.sslemail}} -w /etc/letsencrypt/verify/{{project.domain}} &&
    ln -s /etc/apache2/sites-available/{{project.domain}}-ssl.conf /etc/apache2/sites-enabled/{{project.domain}}-ssl.conf

elif [ "$SSL" = "yes" -a "$LOCAL" = "yes" ]; then

    cp /root/templates/apache-proxy-ssl-local.conf /etc/apache2/sites-available/{{project.domain}}-ssl-local.conf &&
    ln -s /etc/apache2/sites-available/{{project.domain}}-ssl-local.conf /etc/apache2/sites-enabled/{{project.domain}}-ssl-local.conf

elif [ "$SSL" = "no" ]; then

    if [ -e /etc/apache2/sites-available/{{project.domain}}-ssl.conf ]; then

        unlink /etc/apache2/sites-enabled/{{project.domain}}-ssl.conf

    elif [ -e /etc/apache2/sites-available/{{project.domain}}-ssl-local.conf ]; then

        unlink /etc/apache2/sites-enabled/{{project.domain}}-ssl-local.conf

    fi

fi

apachectl graceful
