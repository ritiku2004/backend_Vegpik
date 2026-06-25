const express = require('express');
const router = express.Router();
const { authController, profileController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');
const upload = require('../../../middlewares/uploadMiddleware');

// Auth routes
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtpAndLogin);

// Profile routes (protected)
router.get('/profile', authMiddleware.authenticateJWT, profileController.getProfile);
router.put('/profile', authMiddleware.authenticateJWT, profileController.updateProfile);
router.post('/upload', authMiddleware.authenticateJWT, upload.single('avatar'), profileController.uploadAvatar);

// Address routes (protected)
router.get('/addresses', authMiddleware.authenticateJWT, profileController.getAddresses);
router.post('/addresses', authMiddleware.authenticateJWT, profileController.saveAddress);
router.delete('/addresses/:id', authMiddleware.authenticateJWT, profileController.deleteAddress);

module.exports = router;
