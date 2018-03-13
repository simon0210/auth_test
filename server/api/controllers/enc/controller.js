import EncService from '../../services/enc.service.js';

export class Controller {
    encryptMessage(req, res) {
        EncService
            .encrypt(req, res)
            .then(r => res.json(r));
    }

    validMessage(req, res) {
        EncService
            .valid(req, res)
            .then(r => res.json(r));
    }

    echo(req, res) {
        EncService
            .query(req, res)
            .then(r => res.json(r));
    }
}

export default new Controller();
