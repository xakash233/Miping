const express = require('express');
const billingController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

// Restricted to Super Admin
router.post('/add-credits', auth.restrictTo('SUPER_ADMIN'), billingController.addCredits);

// Available to Tenant Admins
router.get('/transactions', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), billingController.getTransactionHistory);

module.exports = router;
