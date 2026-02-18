const express = require('express');
const tenantController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

router.get('/dashboard', auth.restrictTo('ADMIN', 'SUB_ADMIN'), tenantController.getTenantDashboard);

module.exports = router;
