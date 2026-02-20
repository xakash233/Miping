const express = require('express');
const authController = require('./controller');

const router = express.Router();

router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);

// Self-Service Flow
router.post('/signup/init', authController.initSignup);
router.post('/signup/verify', authController.verifyOTP);
router.post('/signup/create-order', authController.createOrder);
router.post('/signup/complete', authController.completeSignup);

// Debug
router.get('/signup/test-email', async (req, res) => {
    const emailService = require('../../services/email');
    try {
        await emailService.sendOTPEmail(req.query.email || 'test@example.com', '123456');
        res.json({ success: true, message: 'Test email sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
