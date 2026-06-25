const express = require('express');
const router = express.Router();
const { shopInventoryController } = require('../../../controllers/user');

// Fetch products available at a specific shop
router.get('/:shopId', shopInventoryController.getShopInventory);

module.exports = router;
