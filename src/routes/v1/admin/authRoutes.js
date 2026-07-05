const express = require('express');
const router = express.Router();
const { authController } = require('../../../controllers/admin');
const { authMiddleware } = require('../../../middlewares');

router.post('/login', authController.login);
router.post('/change-password', authMiddleware.verifyAdmin, authController.changePassword);
router.post('/create-admin', authMiddleware.verifyAdmin, authController.createAdmin);
router.get('/admins', authMiddleware.verifyAdmin, authController.getAllAdmins);
router.delete('/admins/:id', authMiddleware.verifyAdmin, authController.deleteAdmin);
router.put('/admins/:id/toggle', authMiddleware.verifyAdmin, authController.toggleAdminStatus);

module.exports = router;
