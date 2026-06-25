const userService = require('./user');
const adminService = require('./admin');
const notificationService = require('./notificationService');

module.exports = {
  user: userService,
  admin: adminService,
  notificationService
};
