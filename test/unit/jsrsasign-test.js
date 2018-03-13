'use strict';

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);
var path = require('path');

var jsrsa = require('jsrsasign');
var asn1 = require('jsrsasign').asn1;
var KJUR = require('jsrsasign').KJUR;
var KEYUTIL = require('jsrsasign').KEYUTIL;
var X509 = require('jsrsasign').X509;
var util = require('jsrsasign-util');

var fs = require('fs');
var crypto = require('crypto');

test('\n\n ** Create ECDSA KEY PAIR **\n\n', function (t) {
    var curve = "secp256r1";
    var keypair = KEYUTIL.generateKeypair("EC", curve);

    t.equal(keypair.prvKeyObj.curveName, curve, "prv curve " + curve);
    t.equal(keypair.pubKeyObj.curveName, curve, "pub curve " + curve);

    // var prvPem = asn1.ASN1Util.getPEMStringFromHex(keypair.prvKeyObj.prvKeyHex, "PRIVATE KEY");
    // var pubPem = asn1.ASN1Util.getPEMStringFromHex(keypair.pubKeyObj.pubKeyHex, "PUBLIC KEY");

    // console.log(prvPem);
    // fs.writeFile('./cert/certPrv.pem', prvPem, function (error) {
    //     if (error) {
    //         throw error;
    //     }
    //
    //     console.log("File saved!");
    // });
    //
    // console.log(pubPem);
    // fs.writeFile('./cert/certPub.pem', pubPem, function (error) {
    //     if (error) {
    //         throw error;
    //     }
    //
    //     console.log("File saved!");
    // });

    t.end();
});

// test('\n\n ** File Parse Testing **\n\n', function (t) {
//
//     var data = fs.readFileSync('./cert/certPrv.pem', 'binary');
//     var prvPEM = data;
//     console.log(text);
//     var prv = KEYUTIL.getKey(prvPEM);
//
//
//     util.readFile('./cert/certPrv.pem', 'binary', function(err, data) {
//         var prvPEM = data;
//         var prv = KEYUTIL.getKey(prvPEM);
//         console.log("================================================================================================");
//         console.log(prv);
//         console.log("================================================================================================");
//     });
//
//     t.end();
// });

/*
test('\n\n ** Hash Test **\n\n', function (t) {
    var fs = require('fs');
    var crypto = require('crypto');

    var key = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
        0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f];

    var iv = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f];

    var test_string = "This is the string I am signing";

    // Create SHA1 hash of our string
    var sha1Hash = crypto.createHash("sha1");
    sha1Hash.update(test_string, "utf8");
    var sha1 = sha1Hash.digest();

    var aesCipher =
        crypto.createCipheriv("aes-256-cbc", (new Buffer(key)), (new Buffer(iv)));
    aesCipher.update(sha1, "binary");
    var encrypted = aesCipher.final("binary");

    fs.writeFile('./node_encrypted.bin', encrypted, function (error) {
        if (error) {
            throw error;
        }

        console.log("File saved!");
    });

    t.end();
});
*/


test('\n\n ** Create Certificate && Validate Signature **\n\n', function (t) {

    var curve = "secp256r1";
    var keypair = KEYUTIL.generateKeypair("EC", curve);

    /*
     var prvKeyPkcs8 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS8PRV");
     var prvECDSA = KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(prvKeyPkcs8);
     */

    // 1. generate TBSCertificate (tbs = to be signed)
    var tbsc = new KJUR.asn1.x509.TBSCertificate();

    // 2. add basic fields
    tbsc.setSerialNumberByParam({'int': 1234});
    tbsc.setSignatureAlgByParam({'name': 'SHA256withECDSA'});
    tbsc.setIssuerByParam({'str': "/C=US/O=Test/CN=CA"});
    tbsc.setNotBeforeByParam({'str': "130511235959Z"});
    tbsc.setNotAfterByParam({'str': "150511235959Z"});
    tbsc.setSubjectByParam({'str': "/C=US/O=Test/CN=User1"});
    tbsc.setSubjectPublicKeyByGetKey(keypair.pubKeyObj);

    // 3. add extensions
    tbsc.appendExtension(new KJUR.asn1.x509.BasicConstraints({'cA': false}));
    tbsc.appendExtension(new KJUR.asn1.x509.KeyUsage({'bin': '11'}));
    tbsc.appendExtension(new KJUR.asn1.x509.CRLDistributionPoints({'uri': 'http://a.com/a.crl'}));

    // 4. sign and get PEM certificate with CA private key
    var cert = new KJUR.asn1.x509.Certificate(
        {
            'tbscertobj': tbsc,
            'prvkeyobj': keypair.prvKeyObj
            /*
             ,
             'rsaprvpas': 'password'
             */
        });

    cert.sign();

    /*
     var hex = KEYUTIL.getHexFromPEM(cert.getPEMString());
     var fingerprint = KJUR.crypto.Util.hashHex(hex, 'sha256');
     */

    /*
    fs.writeFile('./cert.pem', cert.getPEMString(), function (error) {
        if (error) {
            throw error;
        }

        console.log("File saved!");
    });
    */

    /*
    fs.writeFile('./cert.der', jsrsa.hextorstr(asn1.ASN1HEX.pemToHex(cert.getPEMString())), function (error) {
        if (error) {
            throw error;
        }

        console.log("File saved!");
    });
    */

    // Generate sign
    var xig = new KJUR.crypto.Signature({"alg": "SHA256withECDSA"});
    xig.init(keypair.prvKeyObj);
    // xig.updateString("messageDigest");
    var sigVal = xig.sign();

    console.log('Sign:\n++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    console.log(sigVal);
    console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

    // Verify sign
    var sig = new KJUR.crypto.Signature({"alg": "SHA256withECDSA"});

    /* Deprecated */
    // sig.initVerifyByCertificatePEM(cert.getPEMString());
    // sig.initVerifyByPublicKey(keypair.pubKeyObj);

    sig.init(KEYUTIL.getKey(cert.getPEMString()));
    // sig.updateString("messageDigest");

    var isValid = sig.verify(sigVal)
    if (isValid) {
        console.log("valid");
    } else {
        console.log("invalid!!!!!!!!!");
    }

    var c = new X509();
    c.readCertPEM(cert.getPEMString());

    t.end();
});
