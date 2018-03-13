var fs = require('fs');

var rs = require('jsrsasign');
var EC_CERT = require('./modules/ec_cert_mgr.js');
var cert_util = require('./modules/cert_util.js');
var asn1 = rs.asn1;
var KEYUTIL = rs.KEYUTIL;


var curve = "secp256r1";
var keypair = KEYUTIL.generateKeypair("EC", curve);

var prvPemPkcs8 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS8PRV");
var puvPemPkcs8 = KEYUTIL.getPEM(keypair.pubKeyObj);

// fs.writeFile('clientPriv.pem', prvPemPkcs8, function (error) {
//     if (error) {
//         throw error;
//     }
//
//     console.log("File saved!");
// });
//
// fs.writeFile('clientPub.pem', puvPemPkcs8, function (error) {
//     if (error) {
//         throw error;
//     }
//
//     console.log("File saved!");
// });

test_verify_certificate();

function test_verify_certificate() {
    try {

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var data = fs.readFileSync('./cert/rootPrv.pem', 'binary');
        var caEc = KEYUTIL.getKey(data);

        // var caEc = cert_util.generateEcKeypair('secp256r1');
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        var ec_cert = new EC_CERT(caEc);
        ec_cert.initTBSCert();

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var data = fs.readFileSync('./cert/testUser/clientPriv.pem', 'binary');
        var clientEc = KEYUTIL.getKey(data);

        // var clientEc = cert_util.generateEcKeypair('secp256r1');
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        ec_cert.setSubjectPublicKeyByGetKey(clientEc);

        ec_cert.setSerialNumberByParam({'int': 1234});
        ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
        var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
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
        ec_cert.saveFile("client.pem");
        var certPEM = ec_cert.getPemString();

        var pemFileFullPath = "root.pem";
        var result = getSelfSignCertificate(caEc, pemFileFullPath);

        if (pemFileFullPath != result) {
            console.log("failed to save pem file: " + result);
            return;
        }
        var caCertPem = cert_util.generateCertPEMFromPath(pemFileFullPath);
        console.log("verify certificate with ca certificate ---> " + cert_util.verifyCertificate(caCertPem, certPEM));
    } catch (exception) {
        console.log(exception);
    }
}

function getSelfSignCertificate(caEc, pemFileFullPath) {
    try {
        var ec_cert = new EC_CERT(caEc);
        // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
        ec_cert.initTBSCert();

        ec_cert.setSubjectPublicKeyByGetKey(caEc);

        ec_cert.setSerialNumberByParam({'int': 1234});
        ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
        var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=ROOT";
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

        if (pemFileFullPath === undefined || pemFileFullPath === null) {
            var certPEM = ec_cert.getPemString();
            console.log(certPEM);
            return ec_cert.getPemString();
        } else {
            ec_cert.saveFile(pemFileFullPath);
            console.log("created in the path: " + pemFileFullPath);
            return pemFileFullPath;
        }

    } catch (exception) {
        console.log(exception);
        return null;
    }
}