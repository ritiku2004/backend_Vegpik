const { authService } = require('../../services/user');
const { responseHelper } = require('../../utils');

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return responseHelper.sendError(res, 400, 'Email address is required');
    }
    await authService.generateAndSendOtp(email);
    return responseHelper.sendSuccess(res, 200, 'OTP sent successfully to your email');
  } catch (error) {
    console.error('Send OTP Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to send OTP');
  }
};

const verifyOtpAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return responseHelper.sendError(res, 400, 'Email address and OTP are required');
    }

    const result = await authService.verifyCustomOtpAndLogin(email, otp);
    return responseHelper.sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return responseHelper.sendError(res, 401, error.message || 'Authentication failed');
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return responseHelper.sendError(res, 400, 'OTP is required to delete your account');
    }

    const userId = req.user.id;
    const email = req.user.email;
    
    // Verify OTP
    await authService.verifyOtpOnly(email, otp);

    // Delete account
    await authService.deleteUserAccount(userId);
    return responseHelper.sendSuccess(res, 200, 'Account deleted successfully');
  } catch (error) {
    console.error('Delete Account Error:', error);
    if (error.message.includes('Invalid or expired OTP')) {
      return responseHelper.sendError(res, 400, error.message);
    }
    return responseHelper.sendError(res, 500, 'Failed to delete account');
  }
};

module.exports = {
  sendOtp,
  verifyOtpAndLogin,
  deleteAccount
};
