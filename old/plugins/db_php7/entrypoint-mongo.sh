#!/bin/sh -l

mongod --fork --logpath=/data/logs &&

mongo < /root/templates/mongo-create-user.js &&

mongod --shutdown &&

mongod --auth
