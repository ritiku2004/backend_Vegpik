const express = require('express');
const router = express.Router();
const { tokenController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// Register a token for user notifications (supports optional user auth decoded inside controller)
router.post('/register', tokenController.registerToken);

module.exports = router;
