const express = require('express');
const router = express.Router();
const { orderController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

router.post('/', authMiddleware.authenticateJWT, orderController.createOrder);
router.get('/', authMiddleware.authenticateJWT, orderController.getUserOrders);
router.post('/verify', authMiddleware.authenticateJWT, orderController.verifyPayment);
router.post('/:id/retry', authMiddleware.authenticateJWT, orderController.retryPayment);

// Webhook endpoint is publicly exposed (no JWT required)
router.post('/webhook', orderController.handleWebhook);

module.exports = router;
