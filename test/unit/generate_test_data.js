
var fs = require('fs');
var csvWriter = require('csv-write-stream');
var writer = csvWriter();
var rs = require('jsrsasign');
var cert_util = require('./modules/cert_util.js');

var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});

// generate 

// generate inquery.csv file for testing inquery performance of BMT
function generateInqueryCSV() {
	var outFile = '/home/kyoungmin/tmp/inquery.csv';
	var header_data = ["user_id", "msessage_hash", "signed_hash", "certificate"];
	var base_user_id = 'customer';
	var data_count = 3;

	var privKeyPath = 'cert-ec/testUser/clientPriv.pem';
	var certKeyPath = 'cert-ec/testUser/client.pem';

	// load private key, certificate
	var keyPair = loadClientCertificatePrvKey(certKeyPath, privKeyPath);
	var privKey = keyPair.prvKey;
	var certPem = keyPair.cert;
	

	var writer = csvWriter({ headers: header_data});
	writer.pipe(fs.createWriteStream(outFile));

	var i = 0;
	for (; i< data_count; i++) {
		var temp_client_id = base_user_id + i;
		var msg_hash = getHashMessage(temp_client_id);
		var signed_hash = getSignedHash(msg_hash, privKey);
		var certPemString = certPem.replace(/[^\x20-\x7E]/gmi, "");
		writer.write([temp_client_id, msg_hash, signed_hash, certPemString]);
	}

	writer.end();
}

function generateInquery() {

	var base_user_id = 'customer';

	var keyPair = loadClientCertificatePrvKeyFromCode();
	var privKey = keyPair.prvKey;
	var certPem = keyPair.cert;
	
	var msg_hash = getHashMessage(temp_client_id);
	console.log(msg_hash);
	var signed_hash = getSignedHash(msg_hash, privKey);
	console.log(signed_hash);
	var certPemString = certPem.replace(/[^\x20-\x7E]/gmi, "");

}

generateInquery();

function loadClientCertificatePrvKey(certPath, prvkeyPath) {
	var certPEM = cert_util.generateCertPEMFromPath(certPath);
	// console.log(certPEM);
	var keyObj = rs.KEYUTIL.getKey(cert_util.generateCertPEMFromPath(prvkeyPath));
	// console.log(keyObj);
	var keyPair = { cert: certPEM, prvKey: keyObj.prvKeyHex};
	return keyPair;
}

function loadClientCertificatePrvKeyFromCode() {
	var certPEM = "-----BEGIN CERTIFICATE-----\r\nMIIB0zCCAXegAwIBAgICBNIwDQYJKoZIhvcNAQEFBQAweDELMAkGA1UEBhMCS1Ix\r\nDjAMBgNVBAgMBVNlb3VsMRQwEgYDVQQHDAtTZW91bmdidWtndTEMMAoGA1UECgwD\r\nUiZEMQ8wDQYDVQQLDAZOZXdJQ1QxEDAOBgNVBAMMB0luZm9zZWMxEjAQBgNVBAQM\r\nCWN1c3RvbWVyMTAeFw0xNzA2MDIxMDM1NTFaFw0xNzA5MDIxMDM1NTFaMBwxCzAJ\r\nBgNVBAYTAlVTMQ0wCwYDVQQKDARURVNUMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD\r\nQgAE40PfzEYKFggj4hQwb2uEzg4jtjz0WwSsOh1ZvrQs0LBfqEo7a4By+dS2/qx0\r\nXb0YhlEYObRlPD6UIadCkgKFIKNKMEgwCQYDVR0TBAIwADALBgNVHQ8EBAMCBsAw\r\nLgYDVR0fBCcwJTAjoCGgH4YdaHR0cDovL3d3dy5pbmZvc2VjL2NvbS9uZXdpY3Qw\r\nDQYJKoZIhvcNAQEFBQADRwAwRAIgDcj3fqTWCSrhSGpecfx5bERtJX0ijj0RbEzq\r\nXCUN514CICXDnMfSq7n6SeZfzNGWBq5sJbC8gHfgoKS/sJoc417v\r\n-----END CERTIFICATE-----\r\n";
	// console.log(certPEM);
	var keyObj = "-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgXNhodAp51fIXHi9s\r\nuMKPhoapi8s0U7tq0CLIv+3rcSChRANCAATjQ9/MRgoWCCPiFDBva4TODiO2PPRb\r\nBKw6HVm+tCzQsF+oSjtrgHL51Lb+rHRdvRiGURg5tGU8PpQhp0KSAoUg\r\n-----END PRIVATE KEY-----\r\n";
	// console.log(keyObj);
	var keyPair = { cert: certPEM, prvKey: keyObj.prvKeyHex};
	return keyPair;
}

function getHashMessage(plain_text) {
	return cert_util.doHashMessage("sha256", plain_text);
}

function getSignedHash(hash, privKey) {
	// var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});
	return ec.signHex(hash, privKey);
}

// generateInqueryCSV();