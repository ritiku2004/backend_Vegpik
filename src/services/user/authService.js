const jwt = require('jsonwebtoken');
const { userModel, otpModel } = require('../../models');
const { emailSender } = require('../../utils');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const generateAndSendOtp = async (email) => {
  // Generate a random 6-digit OTP (123456 for test domains)
  const otpCode = email.endsWith('@vegpik.com') ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60000);
  
  await otpModel.saveOtp(email, otpCode, expiresAt);
  
  // Send OTP via email unless it's a test/mobile domain
  if (!email.endsWith('@vegpik.com')) {
    await emailSender.sendOtpEmail(email, otpCode);
  }
  
  return true; // Do not return the actual OTP code to the frontend
};

const verifyOtpOnly = async (email, otpCode) => {
  const validOtp = await otpModel.getValidOtp(email, otpCode);
  
  if (!validOtp) {
    throw new Error('Invalid or expired OTP');
  }
  
  await otpModel.markOtpAsUsed(validOtp.id);
  return true;
};

const verifyCustomOtpAndLogin = async (email, otpCode) => {
  const validOtp = await otpModel.getValidOtp(email, otpCode);
  
  if (!validOtp) {
    throw new Error('Invalid or expired OTP');
  }
  
  await otpModel.markOtpAsUsed(validOtp.id);

  let user = await userModel.getUserByEmail(email);

  if (!user) {
    const userId = await userModel.createUser({ email });
    user = await userModel.getUserById(userId);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'user' },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: '90d' }
  );

  return {
    user,
    token
  };
};

const deleteUserAccount = async (userId) => {
  try {
    const pool = require('../../config/db');
    
    // Clear user tokens
    await pool.query('DELETE FROM device_tokens WHERE user_id = ?', [userId]);
    
    // Clear user addresses
    await pool.query('DELETE FROM user_addresses WHERE user_id = ?', [userId]);
    
    // Clear cart
    const [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    if (carts.length > 0) {
      const cartId = carts[0].id;
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      await pool.query('DELETE FROM carts WHERE id = ?', [cartId]);
    }
    
    // Anonymize orders instead of deleting them to keep financial records
    await pool.query('UPDATE orders SET user_id = NULL WHERE user_id = ?', [userId]);
    
    // Delete the actual user record
    await userModel.deleteUser(userId);
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    throw new Error('Failed to delete user account due to internal dependencies');
  }
};

module.exports = {
  generateAndSendOtp,
  verifyOtpOnly,
  verifyCustomOtpAndLogin,
  deleteUserAccount
};
