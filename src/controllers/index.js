const userControllers = require('./user');
const adminControllers = require('./admin');

module.exports = {
  user: userControllers,
  admin: adminControllers
};
