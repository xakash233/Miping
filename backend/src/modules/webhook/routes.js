const express = require('express');
const webhookController = require('./controller');

const router = express.Router();

// Meta webhooks are usually not authenticated by our JWT, but by signature verification.
// For MVP, we skip signature verification or assume it's public/protected by other means.

router.post('/meta', webhookController.handleMetaWebhook);
router.get('/meta', webhookController.verifyWebhook);

module.exports = router;
