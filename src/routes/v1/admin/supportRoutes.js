const express = require('express');
const router = express.Router();
const { supportController } = require('../../../controllers/admin');

// social links routes
router.get('/social-links', supportController.getSocialLinks);
router.post('/social-links', supportController.createSocialLink);
router.put('/social-links/:id', supportController.updateSocialLink);
router.delete('/social-links/:id', supportController.deleteSocialLink);

// contact info routes
router.get('/contact-info', supportController.getContactInfo);
router.put('/contact-info/:id', supportController.updateContactInfo);

// support queries routes
router.get('/queries', supportController.getQueries);
router.put('/queries/:id/status', supportController.updateQueryStatus);

module.exports = router;
