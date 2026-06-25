const express = require('express');
const router = express.Router();
const { tokenController } = require('../../../controllers/admin');

// Register a token for admin notifications (no auth needed/requested, consistent with other admin endpoints)
router.post('/register', tokenController.registerAdminToken);

module.exports = router;
