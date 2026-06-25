const pool = require('../config/db');

const saveOtp = async (phoneOrEmail, otp, expiresAt) => {
  const [result] = await pool.query(
    'INSERT INTO otps (phone_number, otp_code, expires_at) VALUES (?, ?, ?)',
    [phoneOrEmail, otp, expiresAt]
  );
  return result.insertId;
};

const getValidOtp = async (phoneOrEmail, otp) => {
  const [rows] = await pool.query(
    'SELECT * FROM otps WHERE phone_number = ? AND otp_code = ? AND is_used = FALSE AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1',
    [phoneOrEmail, otp]
  );
  return rows[0];
};

const markOtpAsUsed = async (id) => {
  await pool.query('UPDATE otps SET is_used = TRUE WHERE id = ?', [id]);
};

module.exports = {
  saveOtp,
  getValidOtp,
  markOtpAsUsed
};
