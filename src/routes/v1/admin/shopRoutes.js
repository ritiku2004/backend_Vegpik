const express = require('express');
const router = express.Router();
const { shopController } = require('../../../controllers/admin');
const { authMiddleware } = require('../../../middlewares');

// All shop routes
router.get('/', shopController.getShops);
router.get('/:id', shopController.getShopById);
router.post('/', shopController.createShop);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

module.exports = router;
