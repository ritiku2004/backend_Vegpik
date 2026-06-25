const express = require('express');
const router = express.Router();
const { userController } = require('../../../controllers/admin');

router.get('/', userController.getUsers);
router.get('/:id/details', userController.getUserDetails);
router.delete('/:id', userController.deleteUser);

module.exports = router;
