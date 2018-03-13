import CertificateService from '../../services/cert.service';

export class Controller {
    query(req, res) {
        CertificateService
            .query(req, res)
            .then(r => res.json(r));
    }

    certificate(req, res) {
        CertificateService
            .certificate(req, res)
            .then(r => res.json(r));
    }

    certificateWithPub(req, res) {
        CertificateService
            .certificateWithPub(req, res)
            .then(r => res.json(r));
    }

    certificateWithPub2(req, res) {
        CertificateService
            .certificateWithPub2(req, res)
            .then(r => res.json(r));
    }

    valid(req, res) {
        CertificateService
            .valid(req, res)
            .then(r => res.json(r));
    }

    revoke(req, res) {
        CertificateService
            .revoke(req, res)
            .then(r => res.json(r));
    }

    update(req, res) {
        CertificateService
            .update(req, res)
            .then(r => res.json(r));
    }
}

export default new Controller();
