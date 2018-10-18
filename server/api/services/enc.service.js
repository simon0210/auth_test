'use strict';

import bunyan from 'bunyan';

const l = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

var path = require('path');
var fs = require('fs');

var cert_util = require('../modules/cert_util.js');
var rs = require('jsrsasign');
var KEYUTIL = rs.KEYUTIL;
var EC_CERT = require('../modules/ec_cert_mgr.js');

export class EncService {

    encrypt(req, res) {

        var reqOption = {
            msg: req.body.message.toString(),
            priPem: req.body.privPem.toString(),
        };

        var hashAlg = "sha256";
        var hashMessage = doHashMessage(hashAlg, reqOption.msg);

        var clientPriv = KEYUTIL.getKey(reqOption.priPem);
        var signedHashMessage = doSignWithClientPrvkey(hashMessage, clientPriv.prvKeyHex);

        var result = {"hashMsg":hashMessage, "signMsg": signedHashMessage};
        return Promise.resolve(result);
    }

    valid(req, res) {

        var reqOption = {
            hashMsg: req.body.hashMsg.toString(),
            signMsg: req.body.signMsg.toString(),
            pubPem: req.body.pubPem.toString(),
        };

        var caEc = loadFabricClientECDSA("server/api/config/cert/root.pem");

        var key = KEYUTIL.getKey(reqOption.pubPem);
        var pubHex = key.pubKeyHex;

        var result;

        try {
            result = verifySignature(caEc, pubHex, reqOption.hashMsg, reqOption.signMsg);
        } catch (exception) {
            result = false;
        }

        var response = {"result" : result};
        return Promise.resolve(response);
    }

    query(req, res) {
        var response = {
            message : req.query.MSG.toString()
        };

        return Promise.resolve(response);
    }

}

function doHashMessage(hashAlg, message) {
    return cert_util.doHashMessage(hashAlg, message);
}

function doSignWithClientPrvkey(hashMessage, prvKey) {
    var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});
    return ec.signHex(hashMessage, prvKey);
}

function loadFabricClientECDSA(pubkeyPath) {
    return rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(pubkeyPath));
}

function verifySignature(caEc, pubHex, mdHex, sigValueHex) {
    var ec_cert = new EC_CERT(caEc);
    return ec_cert.verifySignature(pubHex, mdHex, sigValueHex);
}

export default new EncService();
