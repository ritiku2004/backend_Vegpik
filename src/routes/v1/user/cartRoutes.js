const express = require('express');
const router = express.Router();
const { cartController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// All cart routes for user
router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/update', cartController.updateItem);
router.delete('/remove', cartController.removeItem);
router.post('/merge', cartController.mergeCarts);

// Backward compatibility routes for existing frontend code
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
