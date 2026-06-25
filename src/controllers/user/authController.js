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

module.exports = {
  sendOtp,
  verifyOtpAndLogin
};
