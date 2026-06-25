const express = require('express');
const router = express.Router();
const { catalogController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// Catalog endpoints for users (typically read-only)
router.get('/banners', catalogController.getBanners);
router.get('/categories', catalogController.getCategories);
router.get('/nearest-shop', catalogController.getNearestShop);
router.get('/products', catalogController.getProducts);
router.get('/products/:id', catalogController.getProductById);
router.get('/shops', catalogController.getShops);

module.exports = router;
