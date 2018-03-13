
// usage examples 
// URL=http://localhost:3000/issue BASE_USER_ID=customer- COUNT=10 INQUIRY_FILE=inquiry.csv node issue_inquiry.js
// URL=http://localhost:3000/api/v1/cert BASE_USER_ID=tempcustomer- COUNT=10 INQUIRY_FILE=inquiry.csv node issue_inquiry.js

// var Client = require('node-rest-client').Client;
// var client = new Client();
var request = require('sync-request');

var fs = require('fs');
var csvWriter = require('csv-write-stream');
var writer = csvWriter();
var rs = require('jsrsasign');
var sleep = require('sleep');
var cert_util = require('./modules/cert_util.js');

var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'})


const URL = process.env.URL;
const BASE_USER_ID = process.env.BASE_USER_ID;
const COUNT = process.env.COUNT;
const INQUIRY_FILE = process.env.INQUIRY_FILE;

var inquiry_array = [];

var i = 0;
for (; i<COUNT; i++) {
	issue(i);
	sleep.sleep(1);
}

generateInqueryCSV(inquiry_array);

function issue(index) {
	var issue_data = {
		Id: BASE_USER_ID + index, 
	    	Country: 'KR', 
	    	State: 'SEOUL', 
	    	Location: 'GANGNAMGU',
	    	Organization: 'SKBC',
	    	OrganizationUnit: 'TESTTEAM',
	    	CompanyName: 'SK',
	    	SubjectName: 'Test'
	};
	var args = {
	    data: issue_data,
	    headers: { "Content-Type": "application/json" }
	};
	// console.log(URL);
	// console.log(args);
	/*client.post(URL, args, function (data, response) {
	    // console.log(data);
	    if (data.userId === undefined || data.cert === undefined || data.prvKey === undefined) {
	    		console.log('failed to create certificate for ' + args.data.Id);
	    		return;
	    } else {
	    		// generateInqueryCSV(data);
	    		inquiry_array.push(data);
	    }
	});*/

	var res = request('POST', URL, {
		json: issue_data
	});
	var data = JSON.parse(res.getBody('utf8'));
	inquiry_array.push(data);
}

// generate inquery.csv file for testing inquery performance of BMT
function generateInqueryCSV(inquiry_array) {
	// console.log(data);

	var writer = csvWriter({sendHeaders: false});
	writer.pipe(fs.createWriteStream(INQUIRY_FILE));
	var i = 0;
	for (; i < inquiry_array.length; i++) {
		var certPem = inquiry_array[i].cert;
		var keyObj = rs.KEYUTIL.getKey(inquiry_array[i].cert);
		var privKey = keyObj.prvKey;
		var msg_hash = getHashMessage(inquiry_array[i].userId);
		var signed_hash = getSignedHash(msg_hash, privKey);
		var certPemString = certPem.replace(/[^\x20-\x7E]/gmi, "");

		writer.write({'id': inquiry_array[i].userId, 'hash': msg_hash, 'signedhash': signed_hash, 'cert': certPemString});
	}
	writer.end();

	console.log('total: ' + inquiry_array.length);
}

function getHashMessage(plain_text) {
	return cert_util.doHashMessage("sha256", plain_text);
}

function getSignedHash(hash, privKey) {
	// var ec = new rs.crypto.ECDSA({'curve': 'secp256r1'});
	return ec.signHex(hash, privKey);
}