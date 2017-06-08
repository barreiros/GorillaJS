#!/bin/bash

if [ -e /var/lib/postgresql_{{project.slug}}/PG_VERSION ]; then
    
    echo 'Database already created'

else

    chown postgres:postgres /var/lib/postgresql_{{project.slug}} &&
    chmod 0700 /var/lib/postgresql_{{project.slug}} &&
    cp -r /var/lib/postgresql/9.3/main/* /var/lib/postgresql_{{project.slug}}
    
fi

service postgresql stop &&
cp /root/templates/postgresql.conf /etc/postgresql/9.3/main/postgresql.conf &&
echo "host  all  all 0.0.0.0/0 md5" >> /etc/postgresql/9.3/main/pg_hba.conf &&
service postgresql start &&

sudo -u postgres bash -c "psql -c \"CREATE DATABASE {{database.dbname}};\"" &&
sudo -u postgres bash -c "psql -c \"CREATE USER {{database.username}} WITH PASSWORD '{{database.password}}';\"" &&
sudo -u postgres bash -c "psql -c \"ALTER ROLE {{database.username}} SET client_encoding TO 'utf8';\"" &&
sudo -u postgres bash -c "psql -c \"ALTER ROLE {{database.username}} SET default_transaction_isolation TO 'read committed';\"" &&
sudo -u postgres bash -c "psql -c \"ALTER ROLE {{database.username}} SET timezone TO 'UTC';\"" &&
sudo -u postgres bash -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE {{database.dbname}} TO {{database.username}};\"" 
