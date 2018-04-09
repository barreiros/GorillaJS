#!/bin/sh -l

apk update && 
apk add varnish &&

echo "vcl 4.1;" > /etc/varnish/default.vcl 
echo "backend default {" >> /etc/varnish/default.vcl 
echo "  .host = \"{{project.domain}}\";" >> /etc/varnish/default.vcl 
echo "  .port = \"80\";" >> /etc/varnish/default.vcl 
echo "}" >> /etc/varnish/default.vcl 
echo "include \"/etc/varnish_files/default.vcl\";" >> /etc/varnish/default.vcl

touch /etc/varnish_files/default.vcl

varnishd -F -s malloc,1G -a :80 -b {{project.domain}}:80
