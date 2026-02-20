const express = require('express');
const router = express.Router();
const systemController = require('./controller');

router.get('/health', systemController.getSystemHealth);

module.exports = router;
