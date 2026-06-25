const express = require('express');
const router = express.Router();
const dashboardRoutes = require('./dashboardRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const shopRoutes = require('./shopRoutes');
const shopInventoryRoutes = require('./shopInventoryRoutes');
const orderRoutes = require('./orderRoutes');
const bannerRoutes = require('./bannerRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chargesRoutes = require('./chargesRoutes');
const tokenRoutes = require('./tokenRoutes');
const upload = require('../../../middlewares/uploadMiddleware');
const { responseHelper, ipHelper } = require('../../../utils');

// Public route
router.use('/auth', authRoutes);

// Protected routes (You would ideally add the middleware here)
// router.use(verifyAdmin);

// Mount all admin routes
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/shops', shopRoutes);
router.use('/shop-inventory', shopInventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/banners', bannerRoutes);
router.use('/users', userRoutes);
router.use('/charges', chargesRoutes);
router.use('/token', tokenRoutes);

// Admin file upload route
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return responseHelper.sendError(res, 400, 'No file uploaded');
    }
    const fileUrl = ipHelper.getFormattedUrl(req, req.file);
    return responseHelper.sendSuccess(res, 200, 'Image uploaded successfully', { url: fileUrl });
  } catch (error) {
    console.error('Admin Upload Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to upload image');
  }
});

module.exports = router;
