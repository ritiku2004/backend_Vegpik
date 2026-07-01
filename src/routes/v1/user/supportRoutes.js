const express = require('express');
const router = express.Router();
const { supportController } = require('../../../controllers/user');
const { authMiddleware } = require('../../../middlewares');

// Retrieve dynamic social links and contact info (Public)
router.get('/social-links', supportController.getSocialLinks);
router.get('/contact-info', supportController.getContactInfo);

// Submit a support query (optional authentication)
router.post('/query', (req, res, next) => {
  // If Authorization header is present, authenticate, else bypass
  if (req.headers.authorization) {
    return authMiddleware.authenticateJWT(req, res, next);
  }
  next();
}, supportController.submitSupportQuery);

module.exports = router;
