const express = require('express');
const contactController = require('./controller');
const auth = require('../../middleware/auth');

// Since I am structuring modules/contacts and modules/templates separately, 
// I should probably have separate route files or one main route file entry.
// For now, I'll create this file in modules/contacts/routes.js and copy for templates.

// Actually, I'll return the router for contacts here.
const router = express.Router();

router.use(auth.protect);
// Contact management (Admin, Sub-Admin)
router.post('/import', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), contactController.importContacts);
router.get('/', auth.restrictTo('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN'), contactController.getContacts);

module.exports = router;
