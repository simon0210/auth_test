

var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');

var KR_OFFSET = 9;

exports.generateRsaKeypair = generateRsaKeypair;
exports.generateEcKeypair = generateEcKeypair;
exports.getCurrentDate = getCurrentDate;
exports.getAddMonthsDate = getAddMonthsDate;
exports.generateCertPEM = generateCertPEM;
exports.generateCertPEMFromPath = generateCertPEMFromPath;
exports.verifyCertificate = verifyCertificate;
exports.doHashMessage = doHashMessage;
exports.doVerifySignatureRSA = doVerifySignatureRSA;


function generateRsaKeypair(keylen) {
    return rs.KEYUTIL.generateKeypair("RSA", keylen);
}

function generateEcKeypair(curve) {
    var tmp_curve = 'secp256r1';
    if (curve != null) {
        tmp_curve = curve;
    }
    var newEc = new rs.crypto.ECDSA({'curve': tmp_curve});
    newEc.generateKeyPairHex();
    return newEc;
}

function getCurrentDate(offset) {
    if (offset === undefined || offset === null) offset = KR_OFFSET;
    var result = getWorldTime(offset);
    // console.log(result);
    return result;
}

function getAddMonthsDate(offset, addMonths) {
    if (offset === undefined || offset === null) offset = KR_OFFSET;
    var result = getWorldTime(offset, getDateAddedMonths(addMonths));
    // console.log(result);
    return result;
}

function getDateAddedMonths(monthCnt) {
    var d = new Date();
    var years = Math.floor(monthCnt / 12);
    var months = monthCnt - (years * 12);
    if (years) d.setFullYear(d.getFullYear() + years);
    if (months) d.setMonth(d.getMonth() + months);
    return d;
}

function getWorldTime(tzOffset, date) {
    var now = null;
    if (date === undefined || date === null) {
        now = new Date();
    } else {
        now = date;
    }

    var tz = now.getTime() + (now.getTimezoneOffset() * 60000) + (tzOffset * 3600000);
    now.setTime(tz);
    var s =
        leadingZeros(now.getFullYear(), 4).substring(2, 4) +
        leadingZeros(now.getMonth() + 1, 2) +
        leadingZeros(now.getDate(), 2) +
        leadingZeros(now.getHours(), 2) +
        leadingZeros(now.getMinutes(), 2) +
        leadingZeros(now.getSeconds(), 2);
    return s;
}

function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();

    if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++)
            zero += '0';
    }
    return zero + n;
}

function generateCertPEMFromPath(fileFullName) {
    // var pemString = rsu.readFile(fileFullName);
    // return generateCertPEM(pemString);
    return rsu.readFile(fileFullName);;
}

function generateCertPEM(pemString) {
    var cert = new rs.X509();
    cert.readCertPEM(pemString);
    return cert;
}

function verifyCertificate(caCertPEM, userCertPEM, aDate) {
    try {
    var certificate = new rs.X509();
    certificate.readCertPEM(userCertPEM);

    var hTbsCert = rs.ASN1HEX.getDecendantHexTLVByNthList(certificate.hex, 0, [0]);
    var alg = certificate.getSignatureAlgorithmField();
    var signature = rs.X509.getSignatureValueHex(certificate.hex);

    var notBefore = certificate.getNotBefore();
    var notAfter = certificate.getNotAfter();

    var anchorDate = null;
    if (aDate === undefined || aDate === null) {
        anchorDate = new Date();
    } else {
        anchorDate = aDate;
    }
    var targetDate = getCurrentDate() + "Z";
    if (notBefore > targetDate) {
        //console.log("notBefore error! " + notBefore + " > " + targetDate);
        return false;
    }
    if (notAfter < targetDate) {
        //console.log("notAfter error! " + notAfter + " < " + targetDate);
        return false;
    }

    // Verify against CA
    var sig = new rs.crypto.Signature({alg: alg});
    sig.init(caCertPEM);
    sig.updateHex(hTbsCert);
    return sig.verify(signature);
    } catch (e) {
        console.log(e);
            throw new Error(e);
        }
}

function doHashMessage(algType, plainText) {
    var md = null;
    if (algType == "sha1") {
        md = new rs.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
    } else if (algType == "sha256") {
        md = new rs.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
    } else {
        throw new Error('Not initialized ' + algType);
    }

    md.updateString(plainText);
    return md.digest();
}

function doVerifySignatureRSA(pubKeyStr, hashMsg, signMsg) {
    var pubKey = rs.KEYUTIL.getKey(pubKeyStr);
    return pubKey.verify(hashMsg, signMsg);
}

// console.log(getCurrentDate());

// console.log(getAddMonthsDate(null, 6));

// var str1 = "-----BEGIN CERTIFICATE-----" +
// "MIIB+DCCAZygAwIBAgICBNIwDQYJKoZIhvcNAQEFBQAwgZwxCzAJBgNVBAYTAlVT" +
// "MREwDwYDVQQIDAhNYXJ5bGFuZDERMA8GA1UEBwwIUGFzYWRlbmExFTATBgNVBAoM" +
// "DEJyZW50QmFjY2FsYTENMAsGA1UECwwEUiZCRDEyMDAGA1UEAwwpd3d3LmluZm9z" +
// "ZWMuY29tLWVtYWlsQWRkcmVzcz10ZXN0MUBzay5jb20xDTALBgNVBAQMBFBhcmsw" +
// "HhcNMTcwNTE4MjAxMDAwWhcNMTcwODE4MjAxMDAwWjAcMQswCQYDVQQGEwJVUzEN" +
// "MAsGA1UECgwEVEVTVDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABP8u2592Ddhu" +
// "11f77V2oPwjaHKzqioaAyPjgsnZEB6vV9RbVDNHVBscchmGvaUBsvN7+hiP138e3" +
// "HkarsNHGJuijSjBIMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgbAMC4GA1UdHwQnMCUw" +
// "I6AhoB+GHWh0dHA6Ly93d3cuaW5mb3NlYy9jb20vbmV3aWN0MA0GCSqGSIb3DQEB" +
// "BQUAA0cAMEQCIA08o1xkibZqq6qT0f52o3tziQGid5qUefjjFSy5mE3uAiAz+LQJ" +
// "MFqIs73aA7EBA0q6n6wuFql7jHV0o8YM0mNbrw==" +
// "-----END CERTIFICATE-----";

// var cert = generateCertPEM(str1);
// console.log(cert.getSerialNumberHex());
// console.log(cert.getIssuerString());
// console.log(cert.getSubjectString());
// console.log(cert.getNotBefore());
// console.log(cert.getNotAfter());
