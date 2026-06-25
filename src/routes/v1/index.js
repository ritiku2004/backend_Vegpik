const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const adminRoutes = require('./admin');

// Map /user and /admin paths
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
