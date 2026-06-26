const userService = require('./user');
const adminService = require('./admin');
const notificationService = require('./notificationService');
const receiptService = require('./receiptService');

module.exports = {
  user: userService,
  admin: adminService,
  notificationService,
  receiptService
};
