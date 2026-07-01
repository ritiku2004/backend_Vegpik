const express = require('express');
const router = express.Router();
const { orderController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');
const upload = require('../../../middlewares/uploadMiddleware');

router.post('/', authMiddleware.authenticateJWT, upload.single('payment_screenshot'), orderController.createOrder);
router.get('/', authMiddleware.authenticateJWT, orderController.getUserOrders);
router.get('/:orderId/receipt', authMiddleware.authenticateJWT, orderController.getOrderReceipt);
router.get('/:orderId/invoice', authMiddleware.authenticateJWT, orderController.getOrderReceipt);

module.exports = router;
