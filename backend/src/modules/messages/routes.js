const express = require('express');
const messageController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

// Schedule message (Admin, Sub-Admin)
router.post('/schedule', auth.restrictTo('ADMIN', 'SUB_ADMIN'), messageController.scheduleMessage);
router.get('/history', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), messageController.getMessageHistory);

module.exports = router;
