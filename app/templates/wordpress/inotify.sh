#!/bin/sh -l

inotifywait -m -r -e moved_to,create,modify,delete /var/www/{{project.domain}}_mirror/ |

  while read response; do

    chown -R apache:apache /var/www/{{project.domain}}_mirror/ 
    
done

