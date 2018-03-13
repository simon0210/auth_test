import * as express from 'express';

import certController from './api/controllers/certificate/controller'
import encController from './api/controllers/enc/controller'
import authController from './api/controllers/auth/controller'

// ROUTES FOR OUR API
export default express.Router()
    .post('/register', ::authController.register)
    .post('/enroll', ::authController.enroll)
    .post('/enc', ::encController.encryptMessage)
    .post('/enc/validation', ::encController.validMessage)
    .get('/echo', ::encController.echo)
    .get('/query', ::certController.query)
    .post('/cert', ::certController.certificate)
    .post('/cert/pub', ::certController.certificateWithPub)
    .post('/cert/pub2', ::certController.certificateWithPub2)
    // .post('/cert/pub2', ::certController.certificateWithPub)
    .put('/cert', ::certController.revoke)
    .post('/cert/validation', ::certController.valid)
    .post('/cert/update', ::certController.update);
