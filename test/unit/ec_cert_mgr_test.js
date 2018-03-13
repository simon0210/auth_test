
var rs = require('jsrsasign');
var EC_CERT = require('./modules/ec_cert_mgr.js');
var cert_util = require('./modules/cert_util.js');

// generating cetificate with random CA key pair and random client key pair
function test_certificate() {
	try {
	  var caEc = cert_util.generateEcKeypair('secp256r1');

	  var ec_cert = new EC_CERT(caEc);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  ec_cert.initTBSCert();
	  
	  var clientEc = cert_util.generateEcKeypair('secp256r1');
	  
	  ec_cert.setSubjectPublicKeyByGetKey(clientEc);
	  
	  ec_cert.setSerialNumberByParam({'int': 1234});
	  ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  ec_cert.setIssuerByParam({'str': dn});  

	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  console.log(obj1);
	  ec_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  console.log(obj2);
	  ec_cert.setNotAfterByParam(obj2);

	  ec_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  ec_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  ec_cert.doSign();
	  ec_cert.saveFile("/home/kyoungmin/tmp/skbc2.pem");
	  // var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);
	  console.log("Good Job!");
	} catch (exception) {
	  console.log(exception);
	}
}

// generating cetificate with random CA key pair and random client key pair -> raise error
function test_error_certificate() {
	try {
	  var caEc = cert_util.generateEcKeypair('secp256r1');
	  
	  var ec_cert = new EC_CERT(caEc);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  //ec_cert.initTBSCert();
	  
	  var clientEc = cert_util.generateEcKeypair('secp256r1');
	  
	  ec_cert.setSubjectPublicKeyByGetKey(clientEc);
	  
	  ec_cert.setSerialNumberByParam({'int': 1234});
	  ec_cert.setSignatureAlgByParam({'name': 'SHA1withRSA', 'paramempty': false}); // NOTE: paramempty: false to get NULL in AlgorithmIdentifier (possibly not required)
	  var dn = "/C=US/ST=Maryland/L=Pasadena/O=BrentBaccala/OU=R&BD/CN=www.infosec.com-emailAddress=test1@sk.com/SN=Park";
	  ec_cert.setIssuerByParam({'str': dn});  
	  
	  var str1 = cert_util.getCurrentDate() + "Z";
	  var obj1 = {'str': str1};
	  console.log(obj1);
	  ec_cert.setNotBeforeByParam(obj1);

	  var str2 = cert_util.getAddMonthsDate(null, 3) + "Z";
	  var obj2 = {'str': str2};
	  console.log(obj2);
	  ec_cert.setNotAfterByParam(obj2);

	  ec_cert.setSubjectByParam({'str': "/C=US/O=TEST"});
	  // extension
	  ec_cert.appendExtension(new rs.asn1.x509.BasicConstraints({'cA': false}));
	  ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  ec_cert.doSign();
	  ec_cert.saveFile("/home/kyoungmin/tmp/skbc2.pem");
	  // var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);
	  console.log("Good Job!");
	} catch (exception) {
	  console.log(exception);
	}
}

// sign hashed message
function test_sign(prvKey, msgHashHex) {
	var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});
	return ec.signHex(msgHashHex, prvKey);
}

// verify signature
function test_sign_verify() {
	var ec = cert_util.generateEcKeypair('secp256r1');
	var keypair = ec.generateKeyPairHex();

	var prvHex = keypair.ecprvhex;
	var pubHex = keypair.ecpubhex;
	//console.log("prvHex: " + prvHex);
	//console.log("pubHex: " + pubHex);

	var message = "message";
	var md = new rs.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
	//var md = new rs.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
	md.updateString(message);
	var mdHex = md.digest();
	console.log("mdHex: " + mdHex);

	var sigValueHex = test_sign(prvHex, mdHex);
	console.log("sigValueHex: " + sigValueHex);

	var caEc = cert_util.generateEcKeypair('secp256r1');
	var ec_cert = new EC_CERT(caEc);
	// verify
	var isValid = ec_cert.verifySignature(pubHex, mdHex, sigValueHex);
	console.log("isValid: " + isValid);
}

// 
function test_error_sign_verify() {
	var ec = cert_util.generateEcKeypair('secp256r1');
	var keypair = ec.generateKeyPairHex();

	var prvHex = keypair.ecprvhex;
	var pubHex = keypair.ecpubhex;
	//console.log("prvHex: " + prvHex);
	//console.log("pubHex: " + pubHex);

	var message = "message";
	var md = new rs.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
	//var md = new rs.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
	md.updateString(message);
	var mdHex = md.digest();
	console.log("mdHex: " + mdHex);

	var sigValueHex = test_sign(prvHex, mdHex);
	console.log("original sigValueHex: " + sigValueHex);
	sigValueHex = change_data(sigValueHex);
	console.log("_changed sigValueHex: " + sigValueHex);

	var caEc = cert_util.generateEcKeypair('secp256r1');
	var ec_cert = new EC_CERT(caEc);
	// verify
	var isValid = ec_cert.verifySignature(pubHex, mdHex, sigValueHex);
	console.log("isValid: " + isValid);
}

function change_data(original) {
	var len = original.length;
	var changed_data = original.substring(0, len-3) + "aaa";
	return changed_data;
}

// generate self signed certificate
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
	  ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

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

// verify certificate to check whether the certificate is valid or not
function test_verify_certificate() {
	try {
	  var caEc = cert_util.generateEcKeypair('secp256r1');

	  var ec_cert = new EC_CERT(caEc);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  ec_cert.initTBSCert();
	  
	  var clientEc = cert_util.generateEcKeypair('secp256r1');
	  
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
	  ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  ec_cert.doSign();
	  // ec_cert.saveFile("/home/kyoungmin/tmp/skbc2.pem");
	  var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);

	  // var caCertPem = getSelfSignCertificate(caEc);
	  var pemFileFullPath = "/home/kyoungmin/tmp/root.pem";
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

// verify certificate to check whether the certificate is valid or not -> raise error
function test_error_verify_certificate() {
	try {
	  var caEc = cert_util.generateEcKeypair('secp256r1');

	  var ec_cert = new EC_CERT(caEc);
	  // var ec_cert = new EC_CERT(); // default curve is 'secp256r1'
	  ec_cert.initTBSCert();
	  
	  var clientEc = cert_util.generateEcKeypair('secp256r1');
	  
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
	  ec_cert.appendExtension(new rs.asn1.x509.KeyUsage({'bin':'11'}));
	  ec_cert.appendExtension(new rs.asn1.x509.CRLDistributionPoints({'uri':'http://www.infosec/com/newict'}));

	  ec_cert.doSign();
	  // ec_cert.saveFile("/home/kyoungmin/tmp/skbc2.pem");
	  var certPEM = ec_cert.getPemString();
	  // console.log(certPEM);

	  // create new keypair for error testing
	  var otherCaEc = cert_util.generateEcKeypair('secp256r1');
	  var pemFileFullPath = "/home/kyoungmin/tmp/root2.pem";
	  var result = getSelfSignCertificate(otherCaEc, pemFileFullPath);
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

/*
	1. load client certificate from file (path: "./test/unit/cert/testUser/client.pem") and 
	   client private key from file (path: "./test/unit/cert/testUser/clientPriv.pem")
	2. hash temp message and sign the temp message with client private key
	3. load fabric client certificate from file (path: "./test/unit/cert/rooot.pem")
	4. get client certificate from blockchain (however "./test/unit/cert/testUser/client.pem" file substitue for querying blockchain)
	5. verify client certificate with fabric client certificate for verifying the client certificate's issuer
	6. verify message with client certificate
*/
function test_verify_signature_verify_certificate_with_file() {
	var clientPemPath = "./test/unit/cert/testUser/client.pem";
	var clientPrvPath = "./test/unit/cert/testUser/clientPriv.pem";
	var clientPubPath = "./test/unit/cert/testUser/clientPub.pem";
	var rootPemPath = "./test/unit/cert/root.pem";
	var message = "test-message-for-signature";
	var hashAlg = "sha1"; // "sha256"

	var keyPair = loadClientCertificatePrvKey(clientPemPath, clientPrvPath);
	console.log("---> 1. load cleint certificate from file");
	var hashMessage = doHashMessage(hashAlg, message);
	var signedHashMessage = doSignWithClientPrvkey(hashMessage, keyPair.prvKey);
	console.log("---> 2. hash temp message and sign the temp message with client private key");
	var caCert = loadFabricClientCertificate(rootPemPath);
	console.log("---> 3. load fabric client certificate from file");
	var clientCert = getClientCertificateFromBlockchain(clientPemPath);
	console.log("---> 4. get client certificate from blockchain");
	if (!verifyClientCertificate(caCert, clientCert)) {
		console.log("5. failed to verify client certificate. skip to verify signature");
		return;
	} else {
		console.log("---> 5. succeeded to verify client certificate");
	}
	var caEc = loadFabricClientECDSA(rootPemPath);
	var pubHex = loadClientPubKey(clientPubPath);

	if (!verifySignature(caEc, pubHex, hashMessage, signedHashMessage)) {
		console.log("6. failed to verify signature");
	} else {
		console.log("---> 6. succeeded to verify signature");
		console.log("############# successful login ##############");
	}
}

// use other client pubkey for verify signature
function test_error_verify_signature_verify_certificate_with_file() {
	var clientPemPath = "./test/unit/cert/testUser/client.pem";
	var clientPrvPath = "./test/unit/cert/testUser/clientPriv.pem";
	var clientPubPath = "./test/unit/cert/testUser/clientPub.pem";
	var rootPemPath = "./test/unit/cert/root.pem";
	var otherClientPubPath = "/home/kyoungmin/tmp/root.pem";
	var message = "test-message-for-signature";
	var hashAlg = "sha1"; // "sha256"

	var keyPair = loadClientCertificatePrvKey(clientPemPath, clientPrvPath);
	console.log("---> 1. load cleint certificate from file");
	var hashMessage = doHashMessage(hashAlg, message);
	var signedHashMessage = doSignWithClientPrvkey(hashMessage, keyPair.prvKey);
	console.log("---> 2. hash temp message and sign the temp message with client private key");
	var caCert = loadFabricClientCertificate(rootPemPath);
	console.log("---> 3. load fabric client certificate from file");
	var clientCert = getClientCertificateFromBlockchain(clientPemPath);
	console.log("---> 4. get client certificate from blockchain");
	if (!verifyClientCertificate(caCert, clientCert)) {
		console.log("5. failed to verify client certificate. skip to verify signature");
		return;
	} else {
		console.log("---> 5. succeeded to verify client certificate");
	}
	var caEc = loadFabricClientECDSA(rootPemPath);
	var pubHex = loadClientPubKey(otherClientPubPath);

	if (!verifySignature(caEc, pubHex, hashMessage, signedHashMessage)) {
		console.log("6. failed to verify signature");
	} else {
		console.log("---> 6. succeeded to verify signature");
		console.log("############# successful login ##############");
	}
}

// load client certificate from file (path: "./test/unit/cert/testUser/client.pem") and 
// client private key from file (path: "./test/unit/cert/testUser/clientPriv.pem")
function loadClientCertificatePrvKey(certPath, prvkeyPath) {
	var certPEM = cert_util.generateCertPEMFromPath(certPath);
	// console.log(certPEM);
	var keyObj = rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(prvkeyPath));
	// console.log(keyObj);
	var keyPair = { cert: certPEM, prvKey: keyObj.prvKeyHex};
	return keyPair;
}

function loadClientPubKey(pubkeyPath) {
	var keyObj = rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(pubkeyPath));
	// console.log(keyObj);
	return keyObj.pubKeyHex;
}

function loadFabricClientECDSA(pubkeyPath) {
	return rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(pubkeyPath));
}

// hash temp message
function doHashMessage(hashAlg, message) {
	return cert_util.doHashMessage(hashAlg, message);
}

// sign the temp message with client private key
function doSignWithClientPrvkey(hashMessage, prvKey) {
	var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});
	return ec.signHex(hashMessage, prvKey);
}

// load fabric client certificate from file (path: "./test/unit/cert/rooot.pem")
function loadFabricClientCertificate(certPath) {
	var cert = cert_util.generateCertPEMFromPath(certPath);
	return cert;
}

// get client certificate from blockchain (however "./test/unit/cert/testUser/client.pem" file substitue for querying blockchain)
function getClientCertificateFromBlockchain(certPath) {
	var cert = cert_util.generateCertPEMFromPath(certPath);
	return cert;
}

// verify client certificate with fabric client certificate for verifying the client certificate's issuer
function verifyClientCertificate(caCertPEM, certPEM) {
	return cert_util.verifyCertificate(caCertPEM, certPEM);
}

// verify message with client certificate
function verifySignature(caEc, pubHex, mdHex, sigValueHex) {
	var ec_cert = new EC_CERT(caEc);
	return ec_cert.verifySignature(pubHex, mdHex, sigValueHex);
}

// console.log("####################### test_error_certificate ########################");
// test_error_certificate();
// console.log("####################### test_certificate ########################");
// test_certificate();
// console.log("####################### test_sign_verify ########################");
// test_sign_verify();
// console.log("####################### test_error_sign_verify ########################");
// test_error_sign_verify();
// console.log("####################### test_verify_certificate ########################");
// test_verify_certificate();
// console.log("####################### test_error_verify_certificate ########################");
// test_error_verify_certificate();
console.log("####################### test_verify_signature_verify_certificate_with_file ########################");
test_verify_signature_verify_certificate_with_file();
console.log("####################### test_error_verify_signature_verify_certificate_with_file ########################");
test_error_verify_signature_verify_certificate_with_file();
