const express = require('express');
const router = express.Router();
const { supportController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// Submit a support query (requires authentication)
router.post('/query', authMiddleware.authenticateJWT, supportController.submitSupportQuery);

module.exports = router;
