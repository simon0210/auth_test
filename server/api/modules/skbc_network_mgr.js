'use strict';

var config_manager = require('../config/config_manager.js');
var config = config_manager.getConfig();

import bunyan from 'bunyan';

const log = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

let fs = require('fs');
let path = require('path');

let User = require('fabric-client/lib/User.js');
let copService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
let hfc = require('fabric-client');
let utils = require('fabric-client/lib/utils.js');
let Peer = require('fabric-client/lib/Peer.js');
let Orderer = require('fabric-client/lib/Orderer.js');
let EventHub = require('fabric-client/lib/EventHub.js');
let util = require('util');

let client = new hfc();
let eventhub = [];
let allPeers;

function init() {
    log.debug("init()");

    client = new hfc();

    let channel = client.newChannel(config.channelName);
    let caRootsPath = config.orderer.tls_cacerts;
    let data = fs.readFileSync(caRootsPath);
    let caroots = Buffer.from(data).toString();

    allPeers = {};

    channel.addOrderer(
        client.newOrderer(
            config.orderer.url,
            {
                'pem': caroots,
                'ssl-target-name-override': config.orderer.server_hostname
            }
        )
    );

    // for bmt
    enroll('ORG1', config.memberId, config.memberPwd)
        .then((user => {

            // for bmt
            channel.initialize()
                .then((obj => {
                    log.info('channel info : ' + '  ' + config.channelName);
                }))
                .catch((err => {
                    log.err('Failed to initialize channel. Error: ' + err.stack ? err.stack : err);
                }));

            for (let orgId in config.orgs) {
                if (config.orgs.hasOwnProperty(orgId)) {
                    log.debug('chain addPeer : ' + orgId);

                    let targets = {};
                    let peers = config.orgs[orgId].peers;

                    for (let peerName in peers) {
                        log.debug('peer Name : ' + peerName);

                        if (peers.hasOwnProperty(peerName)) {
                            let pemData = fs.readFileSync(config.orgs[orgId].peers[peerName].tls_cacerts);
                            let opts = {
                                pem: Buffer.from(pemData).toString(),
                                'ssl-target-name-override': peers[peerName].server_hostname
                            };

                            let peer = client.newPeer(peers[peerName].requests, opts);
                            log.info('chain addPeer : ' + '  ' + peer + ' added');
                            channel.addPeer(peer);

                            let eventUrl = peers[peerName].events;

                            // for bmt
                            let eh = client.newEventHub();
                            eh.setPeerAddr(eventUrl, opts);
                            eh.connect();
                            eventhub.push(eh);

                            targets[peerName] = [peer, eventUrl, opts];
                        }
                    }

                    if (targets) {
                        allPeers[orgId] = targets;
                    }
                }
            }
        }))
        .catch((err => {
            log.error('Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
        }));

    return hfc.newDefaultKeyValueStore({
        path: process.env['HOME'] + config.keyValStore
    }).then((store) => {
        log.info("keyValStore Path : " + store._dir);
        client.setStateStore(store);
        return hfc.newCryptoKeyStore({path: process.env['HOME'] + config.keyValStore});
    }).then((cryptoKeyStore) => {
        let cryptoSuite = hfc.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(cryptoKeyStore);
        client.setCryptoSuite(cryptoSuite);
    }).catch((err) => {
        throw new Error(err);
    })
}
exports.init = init;

function getUser(userName) {
    return client.getUserContext(userName, true)
        .then((user) => {
            log.info('Successfully Loaded user \'' + user.getName() + '\'');
            return client.setUserContext(user, false);
        })
        .then((user) => {
            log.info('Current Context :  \'' + user.getName() + '\'');
            return user;
        })
        .catch((err) => {
            log.error('Failed to get User. Error: ' + err.stack ? err.stack : err);
            throw new Error('Get User 실패');
        });
}
exports.getUser = getUser;

function queryChaincode(invoker, id, fcn, args, ver) {
    log.debug('queryChaincode(' + invoker + ', ' + id + ', ' + fcn + ', [' + args + '], ' + ver + ')');

    let channel = client.getChannel(config.channelName);
    let tx_id;

    // for bmt
    let targets = [];
    let peers = allPeers.org1;
    let peer1 = peers.peer1;
    let peer2 = peers.peer2;

    if (peer1[0]._url == config.queryTargetPeer) {
        targets.push(peer1[0]);
    } else if (peer2[0]._url == config.queryTargetPeer) {
        targets.push(peer2[0]);
    }

    return getUser(invoker)
        .then(() => {
            tx_id = client.newTransactionID();
            let request;

            if (targets.length > 0) {
                request = {
                    targets: targets,
                    chaincodeId: id,
                    txId: tx_id,
                    fcn: fcn,
                    args: args
                };
            } else {
                request = {
                    chaincodeId: id,
                    txId: tx_id,
                    fcn: fcn,
                    args: args
                };
            }

            return channel.queryByChaincode(request);
        }, (err) => {
            log.error('Failed to getUser. Error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to getUser : ' + err);
        }).then((response_payloads) => {
                if (response_payloads) {
                    let result = [];
                    for (let i = 0; i < response_payloads.length; i++) {
                        result.push(response_payloads[i].toString('utf8'));
                        log.info(response_payloads[i].toString('utf8'));
                    }
                    return result;
                } else {
                    log.error('response_payloads is null');
                    throw new Error('Failed to get response on query');
                }
            },
            (err) => {
                log.error('Failed to send query due to error: ' + (err.stack ? err.stack : err));
                throw new Error('Failed, got error on query');
            });
};
module.exports.queryChaincode = queryChaincode;


function invokeChaincode(invoker, id, fcn, args, ver) {
    log.debug('invokeChaincode(' + invoker + ', ' + id + ', ' + fcn + ', [' + args + '], ' + ver + ')');

    let channel = client.getChannel(config.channelName);
    let tx_id;
    let nonce;

    return getUser(invoker)
        .then((user) => {
            nonce = utils.getNonce();
            tx_id = client.newTransactionID();

            log.info('setConfigSetting("E2E_TX_ID") = %s', tx_id);

            // send proposal to endorser
            let request = {
                chaincodeId: id,
                fcn: fcn,
                args: args,
                txId: tx_id,
            };
            return channel.sendTransactionProposal(request);
        }, (err) => {
            throw new Error('Failed to send Transaction ' + err);
        }).then((results) => {
            let proposalResponses = results[0];
            let proposal = results[1];
            let header = results[2];
            let all_good = true;
            let err_msg;

            for (let i in proposalResponses) {
                let one_good = false;
                let proposal_response = proposalResponses[i];
                if (proposal_response.response && proposal_response.response.status === 200) {
                    log.info('transaction proposal has response status of good');
                    one_good = channel.verifyProposalResponse(proposal_response);
                    if (one_good) {
                        log.info(' transaction proposal signature and endorser are valid');
                    }
                } else {
                    err_msg = proposal_response;
                    log.error('transaction proposal was bad');
                }
                all_good = all_good & one_good;
            }
            if (all_good) {
                all_good = channel.compareProposalResponseResults(proposalResponses);
                log.info('compareProposalResponseResults execution did not throw an error');
                if (all_good) {
                    log.info(' All proposals have a matching read/writes sets');
                }
                else {
                    log.error(' All proposals do not have matching read/write sets');
                }
            }
            if (all_good) {
                log.info('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
                let request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal,
                    header: header
                };

                ///////////////////////////////////////////////////////////
                // for bmt
                let deployId = tx_id.getTransactionID();

                let eventPromises = [];
                eventhub.forEach((eh) => {
                    if(eh.isconnected()) {
                        let txPromise = new Promise((resolve, reject) => {
                            let handle = setTimeout(reject, 60000);

                            eh.registerTxEvent(deployId.toString(),
                                (tx, code) => {
                                    clearTimeout(handle);
                                    eh.unregisterTxEvent(deployId);

                                    if (code !== 'VALID') {
                                        log.error('The transaction was invalid, code = ' + code);
                                        reject(code);
                                    } else {
                                        log.info('The transaction has been committed on peer ' + eh.getPeerAddr());
                                        resolve();
                                    }
                                },
                                (err) => {
                                    clearTimeout(handle);
                                    log.info('Successfully received notification of the event call back being cancelled for ' + deployId + ' err : ' + err);
                                    resolve();
                                });
                        });
                        eventPromises.push(txPromise);
                    }
                });

                let sendPromise = channel.sendTransaction(request);
                return Promise.all([sendPromise].concat(eventPromises))
                    .then((results) => {
                        return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
                    }).catch((err) => {
                        throw new Error('Failed to send transaction. Error : ' + err);
                    });
                ///////////////////////////////////////////////////////////

            } else {
                log.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                throw new Error(err_msg);
            }
        }, (err) => {
            log.error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
        }).then((response) => {
            if (response.status === 'SUCCESS') {
                log.info('Successfully sent transaction to the orderer.');
                log.info('******************************************************************');
                log.info('export TX_ID=' + '\'' + tx_id + '\'');
                log.info('******************************************************************');
                return 'TX_ID=' + '\'' + tx_id + '\'';
            } else {
                log.error('Failed to order the transaction. Error code: ' + response.status);
                throw new Error('Failed to order the transaction. Error code: ' + response.status);
            }
        }, (err) => {
            log.error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
        });
};
module.exports.invokeChaincode = invokeChaincode;


// ============================================================================================================================
// 														For Fabric CA (Dev Only)
// ============================================================================================================================
function register(organization) {
    var username = 'admin';
    var password = 'admin1234';
    var member;

    var ca_client;
    var msp_id;

    if(organization == 'ORG1') {
        ca_client = new copService(config.orgs.org1.ca.url);
        msp_id = config.orgs.org1.msp_id;
    }

    return ca_client.enroll({
        enrollmentID: username,
        enrollmentSecret: password
    }).then((enrollment) => {
        member = new User(username, client);
        return member.setEnrollment(enrollment.key, enrollment.certificate, msp_id);
    }).then(() => {
        return client.setUserContext(member);
    }).catch((err) => {
        log.error("Failed to enroll - '" + username + "' : " + err.stack ? err.stack : err);
        throw new Error("Failed to obtain an enrolled user : '" + username + "'");
    });
};
module.exports.register = register;

function enroll(organization, userName, secret) {
    log.debug("enroll()");
    let member;

    var ca_client;
    var msp_id;

    var	tlsOptions = {
        trustedRoots: [],
        verify: false
    };

    var cryptoSuite = client.getCryptoSuite();
    if (!cryptoSuite) {
        cryptoSuite = hfc.newCryptoSuite();
        cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({path: 'keyValueStore_fabricClientorg1'}));
        client.setCryptoSuite(cryptoSuite);
    }
    member = new User(userName);
    member.setCryptoSuite(cryptoSuite);

    if(organization == 'ORG1') {
        // need to enroll it with CA server
        var ca_client = new copService(config.orgs.org1.ca.url, tlsOptions, 'ca-org1', cryptoSuite);
        msp_id = config.orgs.org1.msp_id;
    }

    return ca_client.enroll({
        enrollmentID: userName,
        enrollmentSecret: secret
    })
        .then((enrollment) => {
            member = new User(userName);
            return member.setEnrollment(enrollment.key, enrollment.certificate, msp_id);
        })
        .then(() => {
            log.info('Successfully enrolled user \'' + userName + '\'');
            return client.setUserContext(member);
        })
        .then((user) => {
            log.info('Current Context :  \'' + user.getName() + '\'');
            return user;
        })
        .catch((err) => {
            log.error('Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
            throw new Error('Enroll 실패');
        });
}
exports.enroll = enroll;

function getSecret(organization, userName, adminUser) {
    var ca_client;

    if(organization == 'ORG1') {
        ca_client = new copService(config.orgs.org1.ca.url);
    } else if (organization == 'ORG2') {
        ca_client = new copService(config.orgs.org2.ca.url);
    }

    return ca_client.register({
        enrollmentID: userName,
        /* To-Do: Refactor Me */
        affiliation: 'org1.department1'
    }, adminUser);
};
module.exports.getSecret = getSecret;

// ============================================================================================================================
// 														For Fabric NETWORK (Dev Only)
// ============================================================================================================================
