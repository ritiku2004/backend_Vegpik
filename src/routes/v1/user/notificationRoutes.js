const express = require('express');
const router = express.Router();
const { notificationController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// All notification endpoints require authenticated user JWT
router.use(authMiddleware.authenticateJWT);

router.get('/', notificationController.getNotifications);
router.put('/mark-read/:id', notificationController.markRead);
router.put('/mark-all-read', notificationController.markAllRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.clearAll);

module.exports = router;
