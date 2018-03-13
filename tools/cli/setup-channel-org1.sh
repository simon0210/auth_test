#!/bin/bash

echo 'Create Channel..'

peer channel create -o orderer.skinfosec.com:7050 -c channel1 -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/skinfosec.com/orderers/orderer.skinfosec.com/msp/tlscacerts/tlsca.skinfosec.com-cert.pem

echo 'Done'

echo 'Join Channel..'

CORE_PEER_ADDRESS=peer0.org1.skinfosec.com:7051 peer channel join -b channel1.block
CORE_PEER_ADDRESS=peer1.org1.skinfosec.com:7051 peer channel join -b channel1.block

echo 'Done'