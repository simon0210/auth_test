
var rs = require('jsrsasign');
var RSA_CERT = require('./modules/rsa_cert_mgr.js');
var cert_util = require('./modules/cert_util.js');


function test_certificate() {
	try {
	  var caRsaKey = cert_util.generateRsaKeypair(1024);

	  var rsa_cert = new RSA_CERT(caRsaKey.prvKeyObj);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  rsa_cert.initTBSCert();
	  
	  var clientRsa = cert_util.generateRsaKeypair(1024);
	  
	  rsa_cert.setSubjectPublicKeyByGetKey(clientRsa.pubKeyObj);
	  
	  rsa_cert.setSerialNumberByParam({'int': 1234});
	  rsa_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  rsa_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  console.log(obj1);
	  rsa_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  console.log(obj2);
	  rsa_cert.setNotAfterByParam(obj2);

	  rsa_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  rsa_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  rsa_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  rsa_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  rsa_cert.doSign();

	  rsa_cert.saveFile("/home/kyoungmin/tmp/skbc3.pem");
	  // var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);
	  console.log("Good Job!");
	} catch (exception) {
	  console.log(exception);
	}
}

function test_error_certificate() {
	try {
	  var caRsaKey = cert_util.generateRsaKeypair(1024);

	  var rsa_cert = new RSA_CERT(caRsaKey.prvKeyObj);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  // raise error
	  //rsa_cert.initTBSCert();
	  
	  var clientRsa = cert_util.generateRsaKeypair(1024);
	  
	  rsa_cert.setSubjectPublicKeyByGetKey(clientRsa.pubKeyObj);
	  
	  rsa_cert.setSerialNumberByParam({'int': 1234});
	  rsa_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  rsa_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  console.log(obj1);
	  rsa_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  console.log(obj2);
	  rsa_cert.setNotAfterByParam(obj2);

	  rsa_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  rsa_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  rsa_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  rsa_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  rsa_cert.doSign();

	  rsa_cert.saveFile("/home/kyoungmin/tmp/skbc3.pem");
	  // var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);
	  console.log("Good Job!");
	} catch (exception) {
	  console.log(exception);
	}
}

function test_sign(prvKey, hashAlg, msgHashHex) {
	return prvKey.signString(msgHashHex, hashAlg);
}

// function test_verify(pubKey, mdHex, sigValueHex) {
// 	return pubKey.verifyString(mdHex, sigValueHex);
// }

function test_sign_verify() {
	var rsaKey = cert_util.generateRsaKeypair(1024);

	var message = "message";
	var md = new rs.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
	//var md = new rs.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
	md.updateString(message);
	var mdHex = md.digest();
	console.log("mdHex: " + mdHex);
	// supported in md5,sha1,sha224,sha256,sha384,sha512,ripemd160,hmacmd5,hmacsha1,hmacsha224,hmacsha256,hmacsha384,hmacsha512,hmacripemd160
	var sigValueHex = test_sign(rsaKey.prvKeyObj, "sha256", mdHex);
	console.log("sigValueHex: " + sigValueHex);

	var rsa_cert = new RSA_CERT(rsaKey.pubKeyObj);
	var isValid = rsa_cert.verifySignature(mdHex, sigValueHex);
	console.log("isValid: " + isValid);
}

function test_error_sign_verify() {
	var rsaKey = cert_util.generateRsaKeypair(1024);

	var message = "message";
	var md = new rs.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
	//var md = new rs.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
	md.updateString(message);
	var mdHex = md.digest();
	console.log("mdHex: " + mdHex);

	// supported in md5,sha1,sha224,sha256,sha384,sha512,ripemd160,hmacmd5,hmacsha1,hmacsha224,hmacsha256,hmacsha384,hmacsha512,hmacripemd160
	var sigValueHex = test_sign(rsaKey.prvKeyObj, "sha256", mdHex);
	console.log("original sigValueHex: " + sigValueHex);
	sigValueHex = change_data(sigValueHex);
	console.log("_changed sigValueHex: " + sigValueHex);

	var rsa_cert = new RSA_CERT(rsaKey.pubKeyObj);
	var isValid = rsa_cert.verifySignature(mdHex, sigValueHex);
	console.log("isValid: " + isValid);
}

function change_data(original) {
	var len = original.length;
	var changed_data = original.substring(0, len-3) + "aaa";
	return changed_data;
}

function getSelfSignCertificate(caRsaKey, pemFileFullPath) {
	try {
	  var rsa_cert = new RSA_CERT(caRsaKey.prvKeyObj);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  rsa_cert.initTBSCert();
	  
	  rsa_cert.setSubjectPublicKeyByGetKey(caRsaKey.pubKeyObj);
	  
	  rsa_cert.setSerialNumberByParam({'int': 1234});
	  rsa_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  rsa_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  rsa_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  rsa_cert.setNotAfterByParam(obj2);

	  rsa_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  rsa_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  rsa_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  rsa_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  rsa_cert.doSign();

	  if (pemFileFullPath === undefined || pemFileFullPath === null) {
		var certPEM = rsa_cert.getPemString();
	  	console.log(certPEM);
	  	return certPEM;
	  } else {
	  	rsa_cert.saveFile(pemFileFullPath);
	  	console.log("created in the path: " + pemFileFullPath);
	  	return pemFileFullPath;
	  }
	} catch (exception) {
	  console.log(exception);
	}
}

function test_verify_certificate() {
	try {
	  var caRsaKey = cert_util.generateRsaKeypair(1024);

	  var rsa_cert = new RSA_CERT(caRsaKey.prvKeyObj);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  rsa_cert.initTBSCert();
	  
	  var clientRsa = cert_util.generateRsaKeypair(1024);
	  
	  rsa_cert.setSubjectPublicKeyByGetKey(clientRsa.pubKeyObj);
	  
	  rsa_cert.setSerialNumberByParam({'int': 1234});
	  rsa_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  rsa_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  rsa_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  rsa_cert.setNotAfterByParam(obj2);

	  rsa_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  rsa_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  rsa_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  rsa_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  rsa_cert.doSign();
	  // rsa_cert.saveFile("/home/kyoungmin/tmp/skbc3.pem");
	  var certPEM = rsa_cert.getPemString();
	  // console.log(certPEM);

	  // var caCertPem = getSelfSignCertificate(caEc);
	  var pemFileFullPath = "/home/kyoungmin/tmp/root.pem";
	  var result = getSelfSignCertificate(caRsaKey, pemFileFullPath);
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

function test_error_verify_certificate() {
	try {
	  var caRsaKey = cert_util.generateRsaKeypair(1024);

	  var rsa_cert = new RSA_CERT(caRsaKey.prvKeyObj);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  rsa_cert.initTBSCert();
	  
	  var clientRsa = cert_util.generateRsaKeypair(1024);
	  
	  rsa_cert.setSubjectPublicKeyByGetKey(clientRsa.pubKeyObj);
	  
	  rsa_cert.setSerialNumberByParam({'int': 1234});
	  rsa_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  rsa_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  rsa_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  rsa_cert.setNotAfterByParam(obj2);

	  rsa_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  rsa_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  rsa_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  rsa_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  rsa_cert.doSign();

	  // rsa_cert.saveFile("/home/kyoungmin/tmp/skbc3.pem");
	  var certPEM = rsa_cert.getPemString();
	  // console.log(certPEM);

	  // create new keypair for error testing
	  var otherRsaKey = cert_util.generateRsaKeypair(1024);
	  var pemFileFullPath = "/home/kyoungmin/tmp/root2.pem";
	  var result = getSelfSignCertificate(otherRsaKey, pemFileFullPath);
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

// console.log("####################### test_error_certificate ########################");
// test_error_certificate();
// console.log("####################### test_certificate ########################");
// test_certificate();
// console.log("####################### test_sign_verify ########################");
// test_sign_verify();
// console.log("####################### test_error_sign_verify ########################");
// test_error_sign_verify();
console.log("####################### test_verify_certificate ########################");
test_verify_certificate();
console.log("####################### test_error_verify_certificate ########################");
test_error_verify_certificate();
