const express = require('express');
const router = express.Router();
const chargesController = require('../../../controllers/admin/chargesController');

router.get('/', chargesController.getCharges);
router.put('/', chargesController.updateCharges);

module.exports = router;
