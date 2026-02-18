const express = require('express');
const authController = require('../auth/controller'); // Check if auth.protect exists here or middleware
const auth = require('../../middleware/auth');
const whatsappController = require('./controller');

const router = express.Router();

// Protect ALL WhatsApp routes
router.use(auth.protect);

// Connect new account (Admin Only)
router.post('/connect',
    auth.restrictTo('ADMIN', 'SUPER_ADMIN'),
    whatsappController.connectAccount
);

// Get connection status
router.get('/status',
    auth.restrictTo('ADMIN', 'SUPER_ADMIN'),
    whatsappController.getAccountStatus
);

module.exports = router;
