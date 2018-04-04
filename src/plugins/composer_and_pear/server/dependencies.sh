#!/bin/sh -l

# Instalo las dependencias para PECL
apk update &&
apk add --no-cache php7-pear php7-dev build-base gcc abuild binutils libtool &&
rm -rf /var/cache/apk/* &&
pear config-set php_ini /etc/php7/php.ini &&
pecl config-set php_ini /etc/php7/php.ini &&

# Compruebo si ya está instalado Composer
if [ ! -e /usr/local/bin/composer.phar ]; then

    curl -sS https://getcomposer.org/installer | php7 &&
    mv composer.phar /usr/local/bin/composer

fi
