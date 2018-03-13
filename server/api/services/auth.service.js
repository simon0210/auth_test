/**
 * Copyright 2017 SK Infosec All Rights Reserved.
 */

'use strict';

import bunyan from 'bunyan';

const log = bunyan.createLogger({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL
});

const skbc = require('../modules/skbc_network_mgr');
const fs = require('fs');
const path = require('path');

export class AuthService {
    register(req, res) {
        let reqOption = {
            enrollmentID: req.query.enrollmentID.toString(),
            organization: req.query.organization.toString()
        };

        return skbc.register(reqOption.organization)
            .then((admin) => {
                return skbc.getSecret(reqOption.organization, reqOption.enrollmentID, admin);
            })
            .then((secret) => {
                return Promise.resolve({"memberID": reqOption.enrollmentID, "secret": secret})
            });
    }

    enroll(req, res) {
        let reqOption = {
            enrollmentID: req.query.enrollmentID.toString(),
            enrollmentSecret: req.query.enrollmentSecret.toString(),
            organization: req.query.organization.toString()
        };

        return skbc.enroll(reqOption.organization, reqOption.enrollmentID, reqOption.enrollmentSecret)
            .then((user) => {
                log.debug("등록 성공: " + user.getName());
                return Promise.resolve({"result": true});
            }).catch((err) => {
                res.status(500);
                log.error('enroll - ' + err.message);
                return Promise.resolve({"result": false});
            });
    }
}

export default new AuthService();
