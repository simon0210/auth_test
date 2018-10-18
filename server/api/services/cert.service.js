'use strict';

// ============================================================================================================================
// 														Import Library
// ============================================================================================================================
import bunyan from 'bunyan';

const l = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

const fs = require('fs');
const path = require('path');

const rs = require('jsrsasign');
const key_util = rs.KEYUTIL;
const EC_CERT = require('../modules/ec_cert_mgr');
const cert_util = require('../modules/cert_util');
const skbc = require('../modules/skbc_network_mgr');

const config_manager = require('../config/config_manager');
const config = config_manager.getConfig();

const FUNC_TYPE_INVOKE = "invoke";
const FUNC_TYPE_QUERY = "query";
const FUNC_TYPE_DELETE = "delete";
const FUNC_TYPE_UPDATE = "update";
const QUERY_TYPE_CERTIFICATE = "CERTIFICATE";
const QUERY_TYPE_REFER_NUM = "REFER_NUM";
const QUERY_TYPE_PERM_CODE = "PERM_CODE";

const CERT_STAT_ACTIVE = "ACTIVE";
const CERT_STAT_PAUSED = "PAUSED";
const CERT_STAT_EXPIRED = "EXPIRED";
const CERT_STAT_FORCE_EXPIRED = "FORCE_EXPIRED";

const ROOT_PEM = 'server/api/config/cert/root.pem';
const ROOT_PRV_PEM = 'server/api/config/cert/rootPrv.pem';
const ROOT_PUB_PEM = 'server/api/config/cert/rootPub.pem';

export class CertService {

// ============================================================================================================================
// 														Query
// ============================================================================================================================
    query(req, res) {
        var reqOption = {
            id: req.query.userID.toString()
        };

        var args = [];
        args.push(QUERY_TYPE_CERTIFICATE);
        args.push(reqOption.id);

        return queryTransaction(args, res)
            .then(function (result) {
                return Promise.resolve(result);
            });
    }

// ============================================================================================================================
// 														Create Certificate
// ============================================================================================================================
    certificate(req, res) {
        if (config.memberId === null) {
            l.error('config.memberId is null');
            res.status(500).send({error: 'config.memberId is null'});
            return;
        }

        var result;

        // create cert by synchronous
        try {
            result = createCert(req);
        } catch (e) {
            throw new Error(e);
        }

        return invokeTransaction(FUNC_TYPE_INVOKE, result, res)
            .then(function (result) {
                return Promise.resolve(result);
            });
    }

    certificateWithPub(req, res) {
        if (config.memberId === null) {
            l.error('config.memberId is null');
            res.status(500).send({error: 'config.memberId is null'});
            return;
        }

        var result;
        // var pubKey = key_util.getKey(req.query.pubPemString);
        var pubKey = req.body.pubPemString;
        var signMsg = req.body.signMsg;
        var hashMsg = req.body.hashMsg + req.body.ID;

        if (!cert_util.doVerifySignatureRSA(pubKey, hashMsg, signMsg)) {
            l.error('signature is invalid!');
            res.status(500).send({error: 'signature is invalid'});
            return;
        }

        // create cert by synchronous
        try {
            result = createCertWithPubPem(req, pubKey, null, null);
        } catch (e) {
            throw new Error(e);
        }

        return invokeTransaction(FUNC_TYPE_INVOKE, result, res)
            .then(function (result) {
                return Promise.resolve(result);
            });

        res.status(200).send({result: true});
    }

    certificateWithPub2(req, res) {
        if (config.memberId === null) {
            l.error('config.memberId is null');
            res.status(500).send({error: 'config.memberId is null'});
            return;
        }

        var result;
        // var pubKey = key_util.getKey(req.query.pubPemString);
        var pubKey = req.body.pubPemString;
        console.log(pubKey);
        var signMsg = req.body.signMsg;
        var hashMsg = req.body.hashMsg + req.body.ID;

        if (!cert_util.doVerifySignatureRSA(pubKey, hashMsg, signMsg)) {
            l.error('signature is invalid!');
            res.status(500).send({error: 'signature is invalid'});
            return;
        }

        // create cert by synchronous
        try {
            let result = createCertWithPubPem(req, pubKey, null, null);
            return Promise.resolve(result);
        } catch (e) {
            throw new Error(e);
        }
    }

// ============================================================================================================================
// 														Validate Certificate
// ============================================================================================================================
    valid(req, res) {
        if (config.memberId === null) {
            l.error('config.memberId is null');
            res.status(500).send({error: 'config.memberId is null'});
            return;
        }

        return validCertification(req, res)
            .then(function (result) {
                return Promise.resolve(result);
            })
    }

// ============================================================================================================================
// 														Modify Certificate
// ============================================================================================================================
    revoke(req, res) {
        if (config.memberId === null) {
            l.error('config.memberId is null');
            res.status(500).send({error: 'config.memberId is null'});
            return;
        }

        return revokeTransaction(req, res)
            .then(function (result) {
                return Promise.resolve(result);
            })
    }

// ============================================================================================================================
//                                                      Update Certificate
// update logic is exactly same with certificate
// ============================================================================================================================
    update(req, res) {
        var reqOption = {
            id: req.body.ID.toString()
        };

        var args = [];
        args.push(QUERY_TYPE_CERTIFICATE);
        args.push(reqOption.id);
        args.push(getCurrentUnixTime());

        return queryTransaction(args, res)
            .then(function (result) {

                /* TO-DO: Refactor Me */
                var certificate = result.result.certificate;
                var state = result.result.state;
                var userData = parseCertificate(certificate);

                var result2 = null
                try {
                    result2 = createCert(req, userData.sIssuer, userData.sSubject, result.result.ID);
                } catch (e) {
                    throw new Error(e);
                }

                return invokeTransaction(FUNC_TYPE_UPDATE, result2, res)
            })
            .then(function (data) {
                res.status(200).send({msg: data});
            })
            .catch(function (err) {
                l.error('invoke - ' + err);
                res.status(500).send({error: err.message});
            });
    }
}

function createCert(req, savedDn, savedSubject, userId) {
    var reqOption = {};
    var dn;

    if (savedDn === undefined || savedDn === null) {
        reqOption.id = req.body.ID.toString(),
            reqOption.country = req.body.Contry.toString(),
            reqOption.state = req.body.State.toString(),
            reqOption.location = req.body.Location.toString(),
            reqOption.org = req.body.Organization.toString(),
            reqOption.orgUnit = req.body.OrganizationUnit.toString(),
            reqOption.company = req.body.CompanyName.toString(),
            reqOption.subject = req.body.SubjectName.toString();
        dn = "/C=" + reqOption.country + "/ST=" + reqOption.state + "/L=" + reqOption.location + "/O=" + reqOption.org + "/OU="
            + reqOption.orgUnit + "/CN=" + reqOption.company + "/SN=" + reqOption.id;
    } else {
        dn = savedDn;
    }

    var data = fs.readFileSync(ROOT_PRV_PEM, 'binary');
    var rootPrv = data;
    var caEc = key_util.getKey(rootPrv);

    var ec_cert = new EC_CERT(caEc);
    ec_cert.initTBSCert();

    var clientEc = generateClientKeypair(req.body.encType);
    var pkcs8prvpem = key_util.getPEM(clientEc.prvKeyObj, "PKCS8PRV");

    ec_cert.setSubjectPublicKeyByGetKey(key_util.getPEM(clientEc.pubKeyObj));
    ec_cert.setSerialNumberByParam({'int': 1234});
    ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false});

    // var dn = "/C=" + reqOption.country + "/ST=" + reqOption.state + "/L=" + reqOption.location + "/O=" + reqOption.org + "/OU="
    //     + reqOption.orgUnit + "/CN=" + reqOption.company + "/SN=" + reqOption.id;
    ec_cert.setIssuerByParam({'str': dn});

    var str1 = cert_util.getCurrentDate() + "Z";
    var obj1 = {'str': str1};
    ec_cert.setNotBeforeByParam(obj1);

    var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
    var obj2 = {'str': str2};
    ec_cert.setNotAfterByParam(obj2);

    ec_cert.setSubjectByParam({'str': "/C=US/O=TEST"});

    // extension
    ec_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
    ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin': '11'}));
    ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri': 'http://www.infosec/com/newict'}));

    ec_cert.doSign();

    var uid;
    if (userId === undefined || userId === null)
        uid = reqOption.id;
    else
        uid = userId;

    var result = {
        "userId": uid,
        "prvKey": pkcs8prvpem,
        "cert": ec_cert.getPemString()
    };

    return result;
}

function createCertWithPubPem(req, pubKey, savedDn, userId) {
    var reqOption = {};
    var dn;

    if (savedDn === undefined || savedDn === null) {
        reqOption.id = req.body.ID,
            reqOption.country = req.body.Contry,
            reqOption.state = req.body.State,
            reqOption.location = req.body.Location + " ",
            reqOption.org = req.body.Organization,
            reqOption.orgUnit = req.body.OrganizationUnit,
            reqOption.company = req.body.CompanyName,
            reqOption.subject = req.body.SubjectName;
        dn = "/C=" + reqOption.country + "/ST=" + reqOption.state + "/L=" + reqOption.location + "/O=" + reqOption.org + "/OU="
            + reqOption.orgUnit + "/CN=" + reqOption.company + "/SN=" + reqOption.id;
    } else {
        dn = savedDn;
    }

    var data = fs.readFileSync(ROOT_PRV_PEM, 'binary');
    var rootPrv = data;
    var caEc = key_util.getKey(rootPrv);

    var ec_cert = new EC_CERT(caEc);
    ec_cert.initTBSCert();

    ec_cert.setSubjectPublicKeyByGetKey(rs.KEYUTIL.getKey(pubKey));
    ec_cert.setSerialNumberByParam({'int': 1234});
    ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false});
    ec_cert.setIssuerByParam({'str': dn});

    var str1 = cert_util.getCurrentDate() + "Z";
    var obj1 = {'str': str1};
    ec_cert.setNotBeforeByParam(obj1);

    var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
    var obj2 = {'str': str2};
    ec_cert.setNotAfterByParam(obj2);

    ec_cert.setSubjectByParam({'str': "/C=US/O=TEST"});

    // extension
    ec_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
    ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin': '11'}));
    ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri': 'http://www.infosec/com/newict'}));

    ec_cert.doSign();

    var uid;
    if (userId === undefined || userId === null)
        uid = reqOption.id;
    else
        uid = userId;

    var result = {
        "userId": uid,
        "cert": ec_cert.getPemString()
    };

    return result;
}

function parseCertificate(certPem) {
    var cert = cert_util.generateCertPEM(certPem);

    var result = {};
    // result.hSerial = cert.getSerialNumberHex();
    result.sIssuer = cert.getIssuerString();
    result.sSubject = cert.getSubjectString();
    // result.sNotBefore = cert.getNotBefore();
    // result.sNotAfter = cert.getNotAfter();
    return result;
}

function generateClientKeypair(algo) {
    /*
     var tmp_curve = 'secp256r1';

     if (curve != null) {
     tmp_curve = curve;
     }

     var newEc = new rs.crypto.ECDSA({'curve': tmp_curve});
     newEc.generateKeyPairHex();
     */

    var newEc;

    if(algo == 'RSA') {
        newEc = key_util.generateKeypair("RSA", 1024);
    } else if (algo == 'ECDSA') {
        newEc = key_util.generateKeypair("EC", "secp256r1");
    } else {
        throw new Error("Not Supported Enc Type!");
    }

    return newEc;
}

function validCertification(req, res) {
    var reqOption = {
        id: req.body.userID.toString(),
        hashMsg: req.body.hashMsg.toString(),
        signMsg: req.body.signMsg.toString()//,
        //certPem: req.body.certPem.toString()
    };

    var args = [];
    args.push(QUERY_TYPE_CERTIFICATE);
    args.push(reqOption.id);

    return queryTransaction(args, res)
        .then(function (response) {

            var result;

            if (response.error) {
                res.status(400);
                return result = {"result": false, "reason": "User ID or certification does not match"};
            }

            var iserId = response.result.ID;
            var userCert = response.result.certificate;
            var state = response.result.state;

            if (state != CERT_STAT_ACTIVE) {
                res.status(400);
                return result = {"result": false, "reason": "User certification is not valid"};
            }

            var caEc = loadFabricClientECDSA(ROOT_PEM);
            var key = key_util.getKey(userCert);
            var pubHex = key.pubKeyHex;

            /*if (reqOption.certPem == userCert) {
                result = {"result": true};
            } else {
                res.status(400);
                return result = {"result": false, "reason": "User certification does not match"};
            }*/

            try {
                //if (verifySignature(caEc, pubHex, reqOption.hashMsg, reqOption.signMsg)) {
                if (cert_util.doVerifySignatureRSA(userCert, reqOption.hashMsg, reqOption.signMsg)) {
                    result = {"result": true};
                } else {
                    res.status(400);
                    return result = {"result": false, "reason": "end-user signature does not match"};
                }
            } catch (exception) {
                res.status(400);
                return result = {"result": false, "reason": "end-user signature does not match"};
            }

            try {
                if (checkCertValidate(userCert)) {
                    result = {"result": true};
                } else {
                    res.status(400);
                    return result = {"result": false, "reason": "certification validation failed"};
                }
            } catch (exception) {
                res.status(400);
                return result = {"result": false, "reason": "certification validation failed"};
            }

            return result;
        });
}

function loadFabricClientECDSA(pubkeyPath) {
    return rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(pubkeyPath));
}

function verifySignature(caEc, pubHex, mdHex, sigValueHex) {
    var ec_cert = new EC_CERT(caEc);
    return ec_cert.verifySignature(pubHex, mdHex, sigValueHex);
}

function checkCertValidate(result) {
    var rootPem = fs.readFileSync(ROOT_PEM, 'binary');
    var clientPem = result.replace(/\r?\n|\r/g, "");
    var rootPem = rootPem.replace(/\r?\n|\r/g, "");
    //return cert_util.verifyCertificate(rootPem, clientPem);
    return cert_util.verifyCertificate(rootPem, clientPem);
}

function queryTransaction(args, res) {
    var response;

    return skbc.queryChaincode(
        config.memberId,
        config.chainCodeId,
        FUNC_TYPE_QUERY,
        args,
        config.chainCodeVersion)
        .then((result) => {
            if (result.length > 0 && !result[0].startsWith('Error')) {
                return response = {
                    "result": JSON.parse(result[0].replace(/\n/g, "\\n").replace(/\r/g, "\\r"))
                };
            } else {
                res.status(404);
                return response = {"error": "invalid user id"};
            }
        }, (err) => {
            res.status(500);
            return response = {"error": "internal server error due to " + err.stack ? err.stack : err};
        });
}

function getCurrentUnixTime() {
    var current_time = new Date();
    return current_time.getTime().toString();
}

function invokeTransaction(funcType, result, res) {
    var args = [];
    args.push(result.userId);
    args.push(result.cert);
    args.push('REFER-' + result.userId);
    args.push('PERM-' + result.userId);
    args.push(getCurrentUnixTime());

    return skbc.invokeChaincode(
        config.memberId,
        config.chainCodeId,
        funcType,
        args,
        config.chainCodeVersion)
        .then((data) => {
            return result;
        }, (err) => {
            res.status(500);
            return {"error": "internal server error due to " + err.stack ? err.stack : err};
        })
}

function revokeTransaction(req, res) {
    // var args = [];
    // args.push(req.body.userId);
    // args.push(req.body.revokeType);
    // args.push(getCurrentUnixTime());

    var hashMsg = req.body.hashMsg.toString();
    var signMsg = req.body.signMsg.toString();

    var args = [];
    args.push(QUERY_TYPE_CERTIFICATE);
    args.push(req.body.userId);

    return queryTransaction(args, res)
        .then(function (response) {

            var result;

            if (response.error) {
                res.status(400);
                return result = {"result": false, "reason": "User ID or certification does not match"};
            }

            var iserId = response.result.ID;
            var userCert = response.result.certificate;
            var state = response.result.state;

            if (state != CERT_STAT_ACTIVE) {
                res.status(400);
                return result = {"result": false, "reason": "User certification is not valid"};
            }

            if (!cert_util.doVerifySignatureRSA(userCert, hashMsg, signMsg)) {
                l.error('signature is invalid!');
                res.status(400);
                return result = {"result": false, "reason": "end-user signature does not match"};
            }

            var args2 = [];
            args2.push(req.body.userId);
            args2.push(req.body.revokeType);
            args2.push(getCurrentUnixTime());

            return skbc.invokeChaincode(
                config.memberId,
                config.chainCodeId,
                FUNC_TYPE_DELETE,
                args2,
                config.chainCodeVersion)
                .then((data) => { // TO-DO: Refactor Me
                    return {result: true};
                }, (err) => {
                    res.status(500);
                    return {"error": "internal server error due to " + err.stack ? err.stack : err};
                });

            /*try {
                if (checkCertValidate(userCert)) {
                    result = {"result": true};
                } else {
                    res.status(400);
                    return result = {"result": false, "reason": "certification validation failed"};
                }
            } catch (exception) {
                res.status(400);
                return result = {"result": false, "reason": "certification validation failed"};
            }*/

        });
}



export default new CertService();
