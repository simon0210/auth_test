#!/bin/bash

echo '==================================================================================================='
echo 'building nginx..'
docker build -t nginx-lb-skinfosec:skinfosec --tag nginx-lb-skinfosec:skinfosec ./nginx
echo 'completed!'
echo '==================================================================================================='
echo 'building auth sdk..'
docker build -t node-skinfosec:skinfosec --tag node-skinfosec:skinfosec .
echo 'completed!'
echo '==================================================================================================='