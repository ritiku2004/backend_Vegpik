const express = require('express');
const router = express.Router();
const { shopInventoryController } = require('../../../controllers/admin');
const { authMiddleware } = require('../../../middlewares');

// Admin Shop Inventory routes
router.get('/:shopId', shopInventoryController.getShopInventory);
router.put('/toggle', shopInventoryController.toggleAvailability);

module.exports = router;
