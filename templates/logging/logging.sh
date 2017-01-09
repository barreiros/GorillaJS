#!/bin/bash -l

# docker logs $1 -f > $2
docker exec $1 touch /var/log/syslog
docker exec $1 chmod 666 /var/log/syslog
docker exec $1 tail -f /var/log/syslog > $2
