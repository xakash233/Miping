const express = require('express');
const templateController = require('./controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router.use(auth.protect);

// Template management (Admin, Sub-Admin)
router.post('/', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), templateController.createTemplate);
router.get('/', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), templateController.getTemplates);

module.exports = router;
