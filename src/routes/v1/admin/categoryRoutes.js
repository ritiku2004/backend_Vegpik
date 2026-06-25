const express = require('express');
const router = express.Router();
const { categoryController } = require('../../../controllers/admin');
const { authMiddleware } = require('../../../middlewares');

// All category routes should probably be protected in a real app, e.g., authMiddleware.authenticateJWT
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
