import AuthService from '../../services/auth.service';

export class Controller {
    register(req, res) {
        AuthService
            .register(req, res)
            .then(r => res.json(r));
    }

    enroll(req, res) {
        AuthService
            .enroll(req, res)
            .then(r => res.json(r));
    }
}

export default new Controller();
