#!/bin/bash 

SSL={{project.sslenable}}
LOCAL={{project.islocal}}

cp /root/templates/apache-proxy.conf /etc/apache2/sites-available/{{project.domain}}.conf &&
rm -rf /var/www/localhost &&
cp -r /root/templates/app-waiting /var/www/localhost &&

## Configuración del firewall
cp /root/templates/evasive /etc/apache2/mods-enabled/evasive.conf &&
mkdir /var/log/mod_evasive && 

a2enmod evasive proxy proxy_http proxy_wstunnel ssl headers mcrypt &&

ln -s /etc/apache2/sites-available/{{project.domain}}.conf /etc/apache2/sites-enabled/{{project.domain}}.conf &&

apachectl stop && apachectl start &&

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

# Reinicio apache y lo ejecuto en primer plano.
apachectl stop && sleep 1 && apachectl start -D FOREGROUND
