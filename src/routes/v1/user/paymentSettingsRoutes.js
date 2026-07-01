const express = require('express');
const router = express.Router();
const paymentSettingsController = require('../../../controllers/admin/paymentSettingsController');

// Public route to fetch payment settings for checkout
router.get('/', paymentSettingsController.getPaymentSettings);

module.exports = router;
