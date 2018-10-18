'use strict';

import bunyan from 'bunyan';

const l = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

const skbc = require('../modules/skbc_network_mgr');
const fs = require('fs');
const path = require('path');

export class NetworkService {
    initializeNetwork(req, res) {
        return skbc.initializeNetwork()
            .then((chain) => {
                l.debug("초기화 성공: " + chain);
                res.status(200).send({ 'result' : true });
            }).catch((err) => {
                l.error('초기화 실패 - ' + err.message);
                res.status(500).send({ error : err.message });
            });;
    }

    installChainCode(req, res) {
        let reqOption = {
            invoker: req.query.invoker.toString(),
            chainCodeID: req.query.chainCodeID.toString(),
            chainCodePath: req.query.chainCodePath.toString(),
            chainCodeVer: req.query.chainCodeVer.toString()
        };

        let checkPath = process.env['GOPATH'] + '/src/' + reqOption.chainCodePath;

        fs.exists(checkPath, function (exists) {
            if (exists) {
                skbc.instChainCode(reqOption.invoker, reqOption.chainCodeID, reqOption.chainCodePath, reqOption.chainCodeVer)
                    .then(() => {
                        l.info("체인코드 Install 성공");
                        res.status(200).send({msg: '성공'});
                    }).catch((err) => {
                    l.error('instChainCode - ' + err.message);
                    res.status(500).send({error: err.message});
                });
            } else {
                l.error(checkPath);
                res.status(500).send({error: checkPath + ' - 존재하지 않는 경로입니다.'});
            }
        });
    }

    instantiateChainCode(req, res) {
        let reqOption = {
            invoker: req.query.invoker.toString(),
            chainCodeID: req.query.chainCodeID.toString(),
            chainCodePath: req.query.chainCodePath.toString(),
            chainCodeVer: req.query.chainCodeVer.toString()
        };

        let checkPath = process.env['GOPATH'] + '/src/' + chainCodePath;

        fs.exists(checkPath, function (exists) {
            if (exists) {
                skbc.initChainCode(reqOption.invoker, reqOption.chainCodeID, reqOption.chainCodePath, reqOption.chainCodeVer, '', false)
                    .then(() => {
                        l.info("체인코드 Instantiate 성공 ");
                        res.status(200).send({msg: '성공'});
                    }).catch((err) => {
                    l.error('initChainCode - ' + err.message);
                    res.status(500).send({error: err.message});
                });
            } else {
                l.error(checkPath);
                res.status(500).send({error: checkPath + ' - 존재하지 않는 경로입니다.'});
            }
        });
    }
}

export default new NetworkService();
