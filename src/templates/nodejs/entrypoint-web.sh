#!/bin/bash 

mkdir -p /var/www/{{project.domain}}/app /var/www/{{project.domain}}/src /var/www/{{project.domain}}/logs &&

if [ ! -e /var/www/{{project.domain}}/package.json ]; then
    cp /root/templates/package.json /var/www/{{project.domain}}/package.json
fi

if [ ! -e /var/www/{{project.domain}}/app/index.js ]; then
    cp /root/templates/index.js /var/www/{{project.domain}}/app/index.js
fi

if [ ! -e /var/www/{{project.domain}}/app/.foreverignore ]; then
    cp /root/templates/foreverignore /var/www/{{project.domain}}/app/.foreverignore
fi

rm -f /var/www/{{project.domain}}/logs/output.txt &&

cd /var/www/{{project.domain}} && npm install &&

forever --append --watch --watchDirectory /var/www/{{project.domain}}/app -l /var/www/{{project.domain}}/logs/all_logs.txt -o /var/www/{{project.domain}}/logs/output.txt -e /var/www/{{project.domain}}/logs/errors.txt start /var/www/{{project.domain}}/app/index.js &&

tail -f /dev/null

