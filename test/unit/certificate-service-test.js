'use strict';

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var fs = require('fs');
var jsrsa = require('jsrsasign');

var asn1 = jsrsa.asn1;
var KEYUTIL = jsrsa.KEYUTIL;

test('\n\n ** TEST **\n\n', function (t) {

    var curve = "secp256r1";
    var keypair = KEYUTIL.generateKeypair("EC", curve);

    //
    // var prvPem = asn1.ASN1Util.getPEMStringFromHex(keypair.prvKeyObj.prvKeyHex, "EC PRIVATE KEY");
    //
    // var prvPemPkcs1 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS1PRV");
    // var prvPemPkcs5 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS5PRV", "password");
    // var prvPemPkcs8 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS8PRV");

    var prvPemPkcs8 = KEYUTIL.getPEM(keypair.prvKeyObj, "PKCS8PRV");
    var puvPemPkcs8 = KEYUTIL.getPEM(keypair.pubKeyObj);

    fs.writeFile('clientPriv.pem', prvPemPkcs8, function (error) {
        if (error) {
            throw error;
        }

        console.log("File saved!");
    });

    fs.writeFile('clientPub.pem', puvPemPkcs8, function (error) {
        if (error) {
            throw error;
        }

        console.log("File saved!");
    });


    //
    // fs.writeFile('./cert/prvPemPkcs1.pem', prvPemPkcs1, function (error) {
    //     if (error) {
    //         throw error;
    //     }
    //
    //     console.log("File saved!");
    // });
    //
    //
    // fs.writeFile('./cert/prvPemPkcs5.pem', prvPemPkcs5, function (error) {
    //     if (error) {
    //         throw error;
    //     }
    //
    //     console.log("File saved!");
    // });
    //
    // fs.writeFile('./cert/prvPemPkcs8.pem', prvPemPkcs8, function (error) {
    //     if (error) {
    //         throw error;
    //     }
    //
    //     console.log("File saved!");
    // });

    // var data = fs.readFileSync('./cert/prvPemPkcs1.pem', 'binary');
    // var prvPemPkcs1 = data;
    // var prvPemPkcs1 = KEYUTIL.getKey(prvPemPkcs1, null, "pkcs1prv");
    //
    // console.log("================================================================================================");
    // console.log(prvPemPkcs1);
    // console.log("================================================================================================");
    //
    // var data = fs.readFileSync('./cert/prvPemPkcs5.pem', 'binary');
    // var prvPemPkcs5 = data;
    // var prvPemPkcs5 = KEYUTIL.getKey(prvPemPkcs5, "password");
    //
    // console.log("================================================================================================");
    // console.log(prvPemPkcs5);
    // console.log("================================================================================================");


    // var data = fs.readFileSync('./cert/prvPemPkcs8.pem', 'binary');
    // var prvPemPkcs8 = data;
    // var prvPemPkcs8 = KEYUTIL.getKey(prvPemPkcs8);
    //
    // console.log("================================================================================================");
    // console.log(prvPemPkcs8);
    // console.log("================================================================================================");

    t.end();
});
