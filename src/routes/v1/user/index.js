const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const catalogRoutes = require('./catalogRoutes');
const shopInventoryRoutes = require('./shopInventoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const tokenRoutes = require('./tokenRoutes');
const supportRoutes = require('./supportRoutes');
const notificationRoutes = require('./notificationRoutes');

// Mount all user routes
router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/shop-inventory', shopInventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/token', tokenRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
