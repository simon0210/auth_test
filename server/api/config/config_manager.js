import bunyan from 'bunyan';

const log = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

var config = {};
config.orderer = {};
config.orgs = [];
config.orgs.org1 = {};
config.orgs.org1.ca = {};
config.orgs.org1.peers = [];
config.orgs.org1.peers.peer1 = {};
config.orgs.org1.peers.peer2 = {};
// config.orgs.org1.peers.peer3 = {};
// config.orgs.org1.peers.peer4 = {};

const environment = process.env;

function initialize() {
    config.channelName                          = environment.CHANNEL_NAME;
    config.queryTargetPeer                      = environment.QUERY_TARGET_PEER;
    config.keyValStore                          = environment.KEYVALSTORE;
    config.memberId                             = environment.MEMBER_ID;
    config.memberPwd                            = environment.MEMBER_PWD;
    config.chainCodeId                          = environment.CHAINCODE_ID;
    config.chainCodeVersion                     = environment.CHAINCODE_VERSION;

    config.orderer.url                          = environment.ORDERER_URL;
    config.orderer.server_hostname              = environment.ORDERER_SERVER_HOSTNAME;
    config.orderer.tls_cacerts                  = environment.ORDERER_TLS_CACERTS;

    config.orgs.org1.msp_id                     = environment.ORGS_ORG1_MSPID;
    config.orgs.org1.ca.url                     = environment.ORGS_ORG1_CA_URL;
    config.orgs.org1.ca.name                    = environment.ORGS_ORG1_CA_NAME;

    config.orgs.org1.peers.peer1.requests           = environment.ORGS_ORG1_PEERS_PEER1_REQUESTS;
    config.orgs.org1.peers.peer1.events             = environment.ORGS_ORG1_PEERS_PEER1_EVENTS;
    config.orgs.org1.peers.peer1.server_hostname    = environment.ORGS_ORG1_PEERS_PEER1_SERVER_HOSTNAME;
    config.orgs.org1.peers.peer1.tls_cacerts        = environment.ORGS_ORG1_PEERS_PEER1_TLS_CA_CERTS;
    config.orgs.org1.peers.peer2.requests           = environment.ORGS_ORG1_PEERS_PEER2_REQUESTS;
    config.orgs.org1.peers.peer2.events             = environment.ORGS_ORG1_PEERS_PEER2_EVENTS;
    config.orgs.org1.peers.peer2.server_hostname    = environment.ORGS_ORG1_PEERS_PEER2_SERVER_HOSTNAME;
    config.orgs.org1.peers.peer2.tls_cacerts        = environment.ORGS_ORG1_PEERS_PEER2_TLS_CA_CERTS;
    // config.orgs.org1.peers.peer3.requests           = environment.ORGS_ORG1_PEERS_PEER3_REQUESTS;
    // config.orgs.org1.peers.peer3.events             = environment.ORGS_ORG1_PEERS_PEER3_EVENTS;
    // config.orgs.org1.peers.peer3.server_hostname    = environment.ORGS_ORG1_PEERS_PEER3_SERVER_HOSTNAME;
    // config.orgs.org1.peers.peer3.tls_cacerts        = environment.ORGS_ORG1_PEERS_PEER3_TLS_CA_CERTS;
    // config.orgs.org1.peers.peer4.requests           = environment.ORGS_ORG1_PEERS_PEER4_REQUESTS;
    // config.orgs.org1.peers.peer4.events             = environment.ORGS_ORG1_PEERS_PEER4_EVENTS;
    // config.orgs.org1.peers.peer4.server_hostname    = environment.ORGS_ORG1_PEERS_PEER4_SERVER_HOSTNAME;
    // config.orgs.org1.peers.peer4.tls_cacerts        = environment.ORGS_ORG1_PEERS_PEER4_TLS_CA_CERTS;

    config.logLevel = environment.LOG_LEVEL;
}

module.exports = {
    getConfig: function () {
        if (config.channelName == undefined) {
            initialize();
        }
        return config;
    }
}
