
const express = require('express');
const paymentController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

// Allow ADMIN and SUPER_ADMIN to initiate payment
// (Ideally only the Tenant Owner/Admin)
router.post('/create-order', auth.restrictTo('ADMIN', 'SUPER_ADMIN'), paymentController.createOrder);
router.post('/verify', auth.restrictTo('ADMIN', 'SUPER_ADMIN'), paymentController.verifyPayment);

module.exports = router;
