const express = require('express');
const authController = require('./controller');

const router = express.Router();

router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);

module.exports = router;
