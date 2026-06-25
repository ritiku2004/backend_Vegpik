const express = require('express');
const router = express.Router();
const { bannerController } = require('../../../controllers/admin');

router.get('/', bannerController.getBanners);
router.get('/:id', bannerController.getBannerById);
router.post('/', bannerController.createBanner);
router.put('/:id/status', bannerController.toggleBannerStatus);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
