#!/bin/sh

echo 'hello bash'
docker ps -a|grep peer1| awk '{print $1}'
