var program = require('commander');
var rs = require('jsrsasign');
var rsu = require('jsrsasign-util');
var path = require('path');

module.exports = class EC_CERT {

    constructor(ca_ec) {
        if (ca_ec === undefined || ca_ec === null) {
            throw new Error('Not initialized KJUR.crypto.ECDSA');
        }
        this._ca_ec = ca_ec;
    }

    initTBSCert() {
        this._tbsc = new rs.asn1.x509.TBSCertificate();
        this._isSign = false;
    }

    setSubjectPublicKeyByGetKey(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setSubjectPublicKeyByGetKey(obj);
    }

    setSerialNumberByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setSerialNumberByParam(obj);
    }

    setSignatureAlgByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setSignatureAlgByParam(obj);
    }

    setIssuerByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setIssuerByParam(obj);
    }

    setNotBeforeByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setNotBeforeByParam(obj);
    }

    setNotAfterByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setNotAfterByParam(obj);
    }

    setSubjectByParam(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.setSubjectByParam(obj);
    }

    appendExtension(obj) {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._tbsc.appendExtension(obj);
    }

    doSign() {
        if (this._tbsc === undefined || this._tbsc === null) throw new Error('not initialized TBSCertificate. Call first initTBSCert()');
        this._cert = new rs.asn1.x509.Certificate({'tbscertobj': this._tbsc, 'prvkeyobj': this._ca_ec});
        this._cert.sign();
        this._isSign = true;
    }

    getPemString() {
        if (this._isSign) {
            return this._cert.getPEMString();
        } else {
            throw new Error('not initialized certificate. Call first doSign()');
        }
    }

    saveFile(filename) {
        if (this._isSign) {
            rsu.saveFile(filename, this._cert.getPEMString());
        } else {
            throw new Error('not initialized certificate. Call first initTBSCert()');
        }
    }

    verifySignature(pubkeyHex, msgHashHex, sigHex) {
        return this._ca_ec.verifyHex(msgHashHex, sigHex, pubkeyHex);
    }
};
