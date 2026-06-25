const { deviceTokenModel } = require('../../models');
const { responseHelper } = require('../../utils');

const registerAdminToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return responseHelper.sendError(res, 400, 'FCM device token is required.');
    }

    // Register token as admin
    await deviceTokenModel.saveToken({
      userId: null,
      token,
      isAdmin: true
    });

    return responseHelper.sendSuccess(res, 200, 'Admin FCM token registered successfully.');
  } catch (error) {
    console.error('Error registering admin FCM token:', error);
    return responseHelper.sendError(res, 500, 'Failed to register admin FCM token.', error);
  }
};

module.exports = {
  registerAdminToken
};
