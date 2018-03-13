import NetworkService from '../../services/network.service';

export class Controller {
    initializeNetwork(req, res) {
        NetworkService
            .initializeNetwork(req, res)
            .then(r => res.json(r));
    }

    installChainCode(req, res) {
        NetworkService
            .installChainCode(req, res)
            .then(r => res.json(r));
    }

    instantiateChainCode(req, res) {
        NetworkService
            .instantiateChainCode(req, res)
            .then(r => res.json(r));
    }
}

export default new Controller();
