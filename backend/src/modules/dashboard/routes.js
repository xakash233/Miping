const express = require('express');
const dashboardController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.get('/stats', auth.protect, dashboardController.getStats);

module.exports = router;
