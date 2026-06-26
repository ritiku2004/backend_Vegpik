const express = require('express');
const router = express.Router();
const { orderController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

router.post('/', authMiddleware.authenticateJWT, orderController.createOrder);
router.get('/', authMiddleware.authenticateJWT, orderController.getUserOrders);

module.exports = router;
