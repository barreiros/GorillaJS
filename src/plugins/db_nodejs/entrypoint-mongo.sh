#!/bin/sh -l

mongod --fork --logpath=/data/logs &&

mongo < /root/templates/mongo-create-user &&

mongod --shutdown &&

mongod --auth
