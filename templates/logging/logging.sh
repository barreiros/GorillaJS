#!/bin/bash -l

docker logs $1 -f > $2
