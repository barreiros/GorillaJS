#!/bin/bash

# echo "host  all  all 0.0.0.0/0 md5" >> /etc/postgresql/9.3/main/pg_hba.conf &&

mkdir -p /etc/postgresql /var/run/postgresql &&
chown -R postgres:postgres /var/lib/postgresql_{{project.slug}} /var/run/postgresql &&
chmod 0700 /var/lib/postgresql_{{project.slug}} &&

if [ -e /var/lib/postgresql_{{project.slug}}/PG_VERSION ]; then
    
    echo 'Database already created'

else

    su - postgres -c "/usr/bin/initdb -D  /var/lib/postgresql_{{project.slug}}"
    
fi

if ! grep -q "all 0.0.0.0/0" /var/lib/postgresql_{{project.slug}}/pg_hba.conf; then

    echo "host  all  all 0.0.0.0/0 md5" >> /var/lib/postgresql_{{project.slug}}/pg_hba.conf

fi

cp /root/templates/postgresql.conf /etc/postgresql/postgresql.conf &&

su - postgres -c "pg_ctl start -D /etc/postgresql" && 

su - postgres -c "createuser --host=localhost {{database.username}}" &&
su - postgres -c "createdb -h localhost -O {{database.username}} {{database.dbname}}" &&
# su - postgres -c "psql -h localhost -c \"ALTER ROLE \"{{database.username}}\" SET client_encoding TO 'utf8';\" {{database.dbname}} {{database.username}}" &&
# su - postgres -c "psql -h localhost -c \"ALTER ROLE \"{{database.username}}\" SET default_transaction_isolation TO 'read committed';\" {{database.dbname}} {{database.username}}" &&
# su - postgres -c "psql -h localhost -c \"ALTER ROLE \"{{database.username}}\" SET timezone TO 'UTC';\" {{database.dbname}} {{database.username}}" &&
su - postgres -c "psql -h localhost -c \"GRANT ALL PRIVILEGES ON DATABASE \"{{database.dbname}}\" TO \"{{database.username}}\";\" {{database.dbname}} {{database.username}}" &&
su - postgres -c "psql -h localhost -c \"ALTER USER \"{{database.username}}\" WITH PASSWORD '{{database.password}}';\" {{database.dbname}} {{database.username}}" &&

su - postgres -c "pg_ctl stop -D /etc/postgresql" && 
su - postgres -c "postmaster -D /etc/postgresql"
