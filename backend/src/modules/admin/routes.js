const express = require('express');
const adminController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

// Restricted to Super Admin
router.get('/dashboard', auth.restrictTo('SUPER_ADMIN'), adminController.getDashboard);
router.post('/create-tenant', auth.restrictTo('SUPER_ADMIN'), adminController.createTenant);
router.get('/tenants', auth.restrictTo('SUPER_ADMIN'), adminController.getAllTenants);
router.delete('/tenants/:id', auth.restrictTo('SUPER_ADMIN'), adminController.deleteTenant);

module.exports = router;
