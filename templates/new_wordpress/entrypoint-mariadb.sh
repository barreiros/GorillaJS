#!/bin/sh -l

# Check if database already exists.
if [ ! -d "/var/lib/mysql/mysql" ]; then

    # Install database.
    mysql_install_db --user=mysql --ldata=/var/lib/mysql/ &&
    /usr/bin/mysqld_safe --user mysql --datadir='/var/lib/mysql/' &&

    while !(mysqladmin -uroot ping)
    do
       sleep 1
    done

    mysql -uroot  -e "UPDATE mysql.user SET Password=PASSWORD('root_{{database.password}}') WHERE User='root';"
    mysql -uroot  -e "DELETE FROM mysql.user WHERE User='';"
    mysql -uroot  -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -uroot  -e "DROP DATABASE IF EXISTS test;"
    mysql -uroot  -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -uroot  -e "FLUSH PRIVILEGES;"

else

    /usr/bin/mysqld_safe --user mysql --datadir='/var/lib/mysql/' &&

    while !(mysqladmin -uroot -proot_{{database.password}} ping)
    do
       sleep 1
    done

    mysql -uroot -proot_{{database.password}} -e "UPDATE mysql.user SET Password=PASSWORD('root_{{database.password}}') WHERE User='root';"

fi

mysql -uroot -proot_{{database.password}} -e "FLUSH PRIVILEGES;"
mysql -uroot -proot_{{database.password}} -e "CREATE DATABASE IF NOT EXISTS {{database.dbname}};"
mysql -uroot -proot_{{database.password}} -e "GRANT ALL PRIVILEGES ON *.* TO '{{database.username}}'@'%' IDENTIFIED BY '{{database.password}}';"
mysql -uroot -proot_{{database.password}} -e "FLUSH PRIVILEGES;"


mysqladmin -uroot -proot_{{database.password}} shutdown &&
/usr/bin/mysqld_safe --user mysql --datadir='/var/lib/mysql/'

