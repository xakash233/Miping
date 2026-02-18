const express = require('express');
const planController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

// Public Accessible Route (Pricing Page)
router.get('/', planController.getPlans);

router.use(auth.protect);

// Authenticated Routes
router.get('/my-subscription', planController.getMySubscription);

// Admin Only Routes
router.post('/', auth.restrictTo('SUPER_ADMIN'), planController.createPlan);
router.patch('/:id', auth.restrictTo('SUPER_ADMIN'), planController.updatePlan);
router.delete('/:id', auth.restrictTo('SUPER_ADMIN'), planController.deletePlan);

// Assign Plan to Tenant (Super Admin Action)
router.post('/:id/assign', auth.restrictTo('SUPER_ADMIN'), planController.assignPlan);

module.exports = router;
