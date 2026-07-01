const express = require('express');
const router = express.Router();
const paymentSettingsController = require('../../../controllers/admin/paymentSettingsController');

router.get('/', paymentSettingsController.getPaymentSettings);
router.put('/', paymentSettingsController.updatePaymentSettings);

module.exports = router;
