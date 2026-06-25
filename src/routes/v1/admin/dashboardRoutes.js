const express = require('express');
const router = express.Router();
const { dashboardController } = require('../../../controllers/admin');

// Dashboard stats - no auth required (admin panel is client-side protected)
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
